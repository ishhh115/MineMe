import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

// Verify GET request from Whapi when setting up webhook
export async function GET() {
  return NextResponse.json({ status: "webhook active" })
}

// Receive messages from Whapi
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log("========== WEBHOOK RECEIVED ==========")
console.log(JSON.stringify(payload, null, 2))
console.log("=====================================")
    const messages = payload.messages

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "no messages" })
    }

    for (const message of messages) {
      // Only process text messages
      if (message.type !== "text") continue

      const chatId = message.chat_id
      const sender = message.from
      const text = message.text?.body
      const timestamp = message.timestamp
      const messageId = message.id

      // Skip if no text
      if (!text) continue

      // Skip if message is from the bot itself
      if (message.from_me) continue

      console.log("New message received:", { chatId, sender, text, timestamp, messageId })

      // Step 1: Check if this is a reply to a reminder (1, 2, or 3)
      const trimmedText = text.trim()
      if (["1", "2", "3"].includes(trimmedText)) {
        await handleReminderReply({ chatId, sender, reply: trimmedText })
        continue
      }

      // Step 2: Skip very short messages that are not replies
      if (trimmedText.split(" ").length < 3) continue

      // Step 3: Store raw message to Sanity
      await storeRawMessage({ chatId, sender, text, timestamp, messageId })

      // Step 4: Clean the message
      const cleanedText = cleanMessage(text)

      // Step 5: Send to AI for task detection
      await processMessage({ chatId, sender, cleanedText, timestamp, messageId })
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}

// Handle reply to reminder (1 = done, 2 = snooze, 3 = reassign)
async function handleReminderReply({
  chatId,
  sender,
  reply,
}: {
  chatId: string
  sender: string
  reply: string
}) {
  try {
    // Find the most recent pending task for this sender in this group
    const task = await sanityClient.fetch(
      `*[_type == "task" 
        && group->chatId == $chatId
        && status == "pending"
        && whatsappStatus == "awaiting_response"
      ] | order(createdAt desc) [0] {
        _id,
        taskText,
        urgency,
        deadline
      }`,
      { chatId }
    )

    if (!task) {
      console.log("No pending task found for reply:", { chatId, sender, reply })
      return
    }

    const now = new Date().toISOString()

    if (reply === "1") {
      // Mark as completed
      await sanityClient
        .patch(task._id)
        .set({
          status: "completed",
          whatsappStatus: "completed_via_whatsapp",
          completedAt: now,
        })
        .append("timeline", [
          {
            event: "Task completed via WhatsApp",
            timestamp: now,
            actor: sender,
          },
        ])
        .append("actionsLog", [
          {
            action: "completed_via_whatsapp",
            performedBy: sender,
            timestamp: now,
            note: "User replied 1 to reminder",
          },
        ])
        .commit()

      console.log("Task marked complete:", task._id)

      // TODO: Send confirmation back via Whapi when credentials arrive
      // await sendWhatsAppMessage(chatId, "✅ Task marked as complete. Well done!")

    } else if (reply === "2") {
      // Snooze for 2 hours
      const snoozeUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

      await sanityClient
        .patch(task._id)
        .set({
          status: "snoozed",
          whatsappStatus: "snoozed",
          snoozeUntil,
        })
        .append("timeline", [
          {
            event: "Task snoozed for 2 hours via WhatsApp",
            timestamp: now,
            actor: sender,
          },
        ])
        .append("actionsLog", [
          {
            action: "snoozed_via_whatsapp",
            performedBy: sender,
            timestamp: now,
            note: `Snoozed until ${new Date(snoozeUntil).toLocaleTimeString()}`,
          },
        ])
        .commit()

      console.log("Task snoozed:", task._id)

      // TODO: Send confirmation back via Whapi when credentials arrive
      // await sendWhatsAppMessage(chatId, `⏰ Task snoozed until ${new Date(snoozeUntil).toLocaleTimeString()}`)

    } else if (reply === "3") {
      // Reassign — ask who to reassign to
      await sanityClient
        .patch(task._id)
        .append("timeline", [
          {
            event: "Reassign requested via WhatsApp",
            timestamp: now,
            actor: sender,
          },
        ])
        .commit()

      console.log("Reassign requested for task:", task._id)

      // TODO: Send message asking who to reassign to via Whapi
      // await sendWhatsAppMessage(chatId, "🔄 Who should this task be reassigned to? Reply with their name.")
    }

  } catch (error) {
    console.error("Reply handler error:", error)
  }
}

// Clean raw message text
function cleanMessage(text: string): string {
  text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, "")
  text = text.replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
  text = text.replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
  text = text.replace(/[\u{2600}-\u{26FF}]/gu, "")
  text = text.replace(/[\u{2700}-\u{27BF}]/gu, "")
  text = text.replace(/https?:\/\/\S+/g, "")
  text = text.replace(/\*|_|~|`/g, "")
  text = text.replace(/Forwarded message/gi, "")
  text = text.replace(/\s+/g, " ").trim()
  text = text.toLowerCase()
  return text
}

// Store raw message to Sanity
async function storeRawMessage({
  chatId,
  sender,
  text,
  timestamp,
  messageId,
}: {
  chatId: string
  sender: string
  text: string
  timestamp: number
  messageId: string
}) {
  try {
    // Find group by chatId
    const group = await sanityClient.fetch(
      `*[_type == "group" && chatId == $chatId][0]{ _id, "organisationId": organisation._ref }`,
      { chatId }
    )

    const orgId = group?.organisationId
    if (!orgId || !group?._id) return

    // Check if message already exists to prevent duplicates
    const existing = await sanityClient.fetch(
      `*[_type == "message" && messageId == $messageId][0]`,
      { messageId }
    )

    if (existing) return

    // Save raw message
    await sanityClient.create({
      _type: "message",
      organisation: { _type: "reference", _ref: orgId },
      group: { _type: "reference", _ref: group._id },
      messageId,
      chatId,
      sender,
      text,
      timestamp: new Date(timestamp * 1000).toISOString(),
      isTask: false,
      processed: false,
      createdAt: new Date().toISOString(),
    })

    // Update group message count
    await sanityClient
      .patch(group._id)
      .inc({ messagesCount: 1 })
      .set({ lastMessageAt: new Date().toISOString() })
      .commit()

  } catch (error) {
    console.error("Store message error:", error)
  }
}

// Send to AI for task detection
async function processMessage({
  chatId,
  sender,
  cleanedText,
  timestamp,
  messageId,
}: {
  chatId: string
  sender: string
  cleanedText: string
  timestamp: number
  messageId: string
}) {
  try {
    const group = await sanityClient.fetch(
      `*[_type == "group" && chatId == $chatId][0]{ "organisationId": organisation._ref }`,
      { chatId }
    )
    const orgId = group?.organisationId

    if (!orgId) return

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: cleanedText,
        chatId,
        sender,
        messageId,
        timestamp,
        orgId,
      }),
    })

    const result = await response.json()
    console.log("Process result:", result)
  } catch (error) {
    console.error("Process message error:", error)
  }
}