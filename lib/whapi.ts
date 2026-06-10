  // Whapi sender — sends WhatsApp messages back to users
  const WHAPI_TOKEN = process.env.WHAPI_API_TOKEN
  const WHAPI_URL = process.env.WHAPI_CHANNEL_URL || "https://gate.whapi.cloud"

  // Send a text message to a WhatsApp chat
  export async function sendWhatsAppMessage(
    chatId: string,
    message: string,
    options?: { token?: string; baseUrl?: string }
  ) {
    const token = options?.token || WHAPI_TOKEN
    const baseUrl = options?.baseUrl || WHAPI_URL

    if (!token) {
      console.log("Whapi token not set — skipping WhatsApp send")
      return { success: false, reason: "no_token" }
    }

    try {

    console.log("WHAPI PAYLOAD:", {
      to: chatId,
      body: message,
    })

    const response = await fetch(`${baseUrl}/messages/text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: chatId,
          body: message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Whapi send error:", data)
        return { success: false, error: data }
      }

      return { success: true, messageId: data.id }
    } catch (error) {
      console.error("Whapi send error:", error)
      return { success: false, error }
    }
  }

  // Format reminder message for WhatsApp
  export function formatReminderMessage({
    taskText,
    assignedTo,
    deadline,
    groupName,
    urgency,
  }: {
    taskText: string
    assignedTo?: string
    deadline?: string
    groupName?: string
    urgency: string
  }) {
    const urgencyEmoji = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    }[urgency] || "🟡"

    const deadlineText = deadline
      ? new Date(deadline).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "No deadline set"

    return `${urgencyEmoji} *MineMe Reminder*

  *Task:* ${taskText}
  ${assignedTo ? `*Assigned to:* ${assignedTo}` : ""}
  *Deadline:* ${deadlineText}
  ${groupName ? `*Group:* ${groupName}` : ""}

  Reply with:
  *1* — ✅ Mark as Done
  *2* — ⏰ Snooze 2 hours

  _Powered by MineMe_`
  }

  // Send reminder to assigned person
  export async function sendTaskReminder({
    chatId,
    taskText,
    assignedTo,
    deadline,
    groupName,
    urgency,
    token,
    baseUrl,
  }: {
    chatId: string
    taskText: string
    assignedTo?: string
    deadline?: string
    groupName?: string
    urgency: string
    token?: string
    baseUrl?: string
  }) {
    const message = formatReminderMessage({
    taskText,
    assignedTo,
    deadline,
    groupName,
    urgency,
  })

  console.log("REMINDER TARGET:", chatId)
  console.log("REMINDER BODY:", message)
  console.log("TOKEN:", token?.slice(0, 10))

  return await sendWhatsAppMessage(chatId, message, { token, baseUrl })
  }