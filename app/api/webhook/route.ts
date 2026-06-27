import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { sendWhatsAppMessage } from "@/lib/whapi"

// Verify GET request from Whapi when setting up webhook
export async function GET() {
  return NextResponse.json({ status: "webhook active" })
}

// Receive messages from Whapi
export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const messages = payload.messages

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "no messages" })
    }

    for (const message of messages) {
      // Handle edited WhatsApp messages
      if (
        message.type === "action" &&
        message.action?.type === "edit"
      ) {
        const editedText = message.action?.edited_content?.body
        const originalMessageId = message.action?.target

        if (editedText) {
          await processMessage({
            chatId: message.chat_id,
            groupName: message.chat_name,
            sender: message.from,
            cleanedText: cleanMessage(editedText),
            timestamp: message.timestamp,
            messageId: originalMessageId,
          })
        }
        continue
      }

      // Only process text messages and button replies
      if (
        message.type !== "text" &&
        !(message.type === "reply" && message.reply?.type === "buttons_reply")
      ) {
        continue
      }

      const chatId = message.chat_id
      const sender = message.from
      const timestamp = message.timestamp
      const messageId = message.id
      const text = message.text?.body
      const buttonReply = message.reply?.buttons_reply?.id || null

      if (!text && !buttonReply) continue
      if (message.from_me) continue



      const trimmedText = text?.trim() || ""

      // ── STEP 1: Check for /connect claim command ──────────────────────────
      if (trimmedText.toLowerCase().startsWith("/connect ")) {
        await handleGroupClaim({
          chatId,
          groupName: message.chat_name,
          sender,
          inviteCode: trimmedText.slice(9).trim(),
        })
        continue
      }

      // ── STEP 2: Check if this is a reminder reply (1 or 2) ───────────────
      if (
        ["1", "2"].includes(trimmedText) ||
        buttonReply === "ButtonsV3:done" ||
        buttonReply === "ButtonsV3:snooze"
      ) {
        await handleReminderReply({
          chatId,
          sender,
          reply:
            buttonReply === "ButtonsV3:done"
              ? "1"
              : buttonReply === "ButtonsV3:snooze"
              ? "2"
              : trimmedText,
        })
        continue
      }

      // ── STEP 3: Skip very short messages ─────────────────────────────────
      if (trimmedText.split(" ").length < 3) continue

      // ── STEP 4: Store raw message to Sanity ──────────────────────────────
      await storeRawMessage({ chatId, sender, text, timestamp, messageId })

      // ── STEP 5: Clean and send to AI ─────────────────────────────────────
      const cleanedText = cleanMessage(text)

      await processMessage({
        chatId,
        groupName: message.chat_name,
        sender,
        cleanedText,
        timestamp,
        messageId,
      })
    }


    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}

// ── NEW: Handle /connect INVITE_CODE ─────────────────────────────────────────
async function handleGroupClaim({
  chatId,
  groupName,
  sender,
  inviteCode,
}: {
  chatId: string
  groupName?: string
  sender: string
  inviteCode: string
}) {
  try {


    if (!inviteCode) {
      await sendWhatsAppMessage(
        chatId,
        `❌ Invalid command. Send: /connect YOUR_INVITE_CODE`
      )
      return
    }

    // Look up which org owns this invite code
    const org = await sanityClient.fetch(
      `*[_type == "organisation" && inviteCode == $inviteCode][0]{ _id, name, inviteCode }`,
      { inviteCode }
    )

    if (!org) {

      await sendWhatsAppMessage(
        chatId,
        `❌ Invalid invite code: ${inviteCode}\n\nPlease check your code and try again.`
      )
      return
    }



    // Check if this group is already claimed
    const existingGroup = await sanityClient.fetch(
      `*[_type == "group" && chatId == $chatId][0]{ _id, name, "organisationId": organisation._ref }`,
      { chatId }
    )

    const now = new Date().toISOString()

    if (existingGroup) {
      if (existingGroup.organisationId === org._id) {
        // Already claimed by same org — just confirm
        await sendWhatsAppMessage(
          chatId,
          `✅ This group is already connected to *${org.name}*.\n\nAll messages are being monitored.`
        )
        return
      }

      // Claimed by a different org — update ownership
      await sanityClient
        .patch(existingGroup._id)
        .set({
          organisation: { _type: "reference", _ref: org._id },
          isMonitoring: true,
          lastMessageAt: now,
        })
        .commit()



      await sendWhatsAppMessage(
        chatId,
        `🔄 Group reconnected to *${org.name}*.\n\nMindMe is now monitoring this group for tasks.`
      )
      return
    }

    // Brand new group — create it under the correct org
    const newGroup = await sanityClient.create({
      _type: "group",
      chatId,
      name: groupName || chatId,
      organisation: { _type: "reference", _ref: org._id },
      isMonitoring: true,
      messagesCount: 0,
      tasksExtracted: 0,
      completedTasksCount: 0,
      completionPercentage: 0,
      createdAt: now,
    })



    await sendWhatsAppMessage(
      chatId,
      `✅ Group successfully connected to *${org.name}*!\n\nMindMe will now monitor this group and extract tasks automatically.`
    )
  } catch (error) {
    console.error("Group claim error:", error)
  }
}

// ── Handle reminder reply (1 = done, 2 = snooze) ─────────────────────────────
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
      return
    }

    const now = new Date().toISOString()

    if (reply === "1") {
      await sanityClient
        .patch(task._id)
        .set({
          status: "completed",
          whatsappStatus: "completed_via_whatsapp",
          completedAt: now,
        })
        .append("timeline", [{ event: "Task completed via WhatsApp", timestamp: now, actor: sender }])
        .append("actionsLog", [{ action: "completed_via_whatsapp", performedBy: sender, timestamp: now, note: "User replied 1 to reminder" }])
        .commit()


      await sendWhatsAppMessage(chatId, `✅ Task marked as completed.\n\nTask: ${task.taskText}`)

    } else if (reply === "2") {
      const snoozeUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

      await sanityClient
        .patch(task._id)
        .set({ status: "snoozed", whatsappStatus: "snoozed", snoozeUntil })
        .append("timeline", [{ event: "Task snoozed for 2 hours via WhatsApp", timestamp: now, actor: sender }])
        .append("actionsLog", [{ action: "snoozed_via_whatsapp", performedBy: sender, timestamp: now, note: `Snoozed until ${new Date(snoozeUntil).toLocaleTimeString()}` }])
        .commit()


      await sendWhatsAppMessage(chatId, `⏰ Task snoozed for 2 hours.\n\nTask: ${task.taskText}`)
    }
  } catch (error) {
    console.error("Reply handler error:", error)
  }
}

// ── Clean raw message text ────────────────────────────────────────────────────
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

// ── Store raw message to Sanity ───────────────────────────────────────────────
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
    const group = await sanityClient.fetch(
      `*[_type == "group" && chatId == $chatId][0]{
        _id, name, chatId, "organisationId": organisation._ref
      }`,
      { chatId }
    )



    const orgId = group?.organisationId
    if (!orgId || !group?._id) {
      return
    }

    const existing = await sanityClient.fetch(
      `*[_type == "message" && messageId == $messageId][0]`,
      { messageId }
    )
    if (existing) return

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

    await sanityClient
      .patch(group._id)
      .setIfMissing({ messagesCount: 0 })
      .inc({ messagesCount: 1 })
      .set({ lastMessageAt: new Date().toISOString() })
      .commit()
  } catch (error) {
    console.error("Store message error:", error)
  }
}

// ── Send to AI for task detection ─────────────────────────────────────────────
async function processMessage({
  chatId,
  groupName,
  sender,
  cleanedText,
  timestamp,
  messageId,
}: {
  chatId: string
  groupName?: string
  sender: string
  cleanedText: string
  timestamp: number
  messageId: string
}) {
  try {
    const group = await sanityClient.fetch(
      `*[_type == "group" && chatId == $chatId][0]{
        _id, name, chatId, "organisationId": organisation._ref
      }`,
      { chatId }
    )



    const orgId = group?.organisationId

    if (!orgId) {
      // Group not claimed yet — do NOT auto-create under any default org

      return
    }

    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/process`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          chatId,
          groupName,
          sender,
          messageId,
          timestamp,
          orgId,
        }),
      }
    )

    const result = await response.json()

  } catch (error) {
    console.error("Process message error:", error)
  }
}