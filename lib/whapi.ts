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

  export async function sendInteractiveReminder(
  chatId: string,
  message: string,
  token?: string
) {
  const response = await fetch(
    `${WHAPI_URL}/messages/interactive`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || WHAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: chatId,
        type: "button",
        body: {
          text: message,
        },
        action: {
          buttons: [
            {
              type: "quick_reply",
              title: "✅ Done",
              id: "done",
            },
            {
              type: "quick_reply",
              title: "⏰ Snooze",
              id: "snooze",
            },
          ],
        },
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error("Interactive message error:", data)
    return { success: false, error: data }
  }

  return { success: true, data }
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

  return `${urgencyEmoji} *MindMe Reminder*

*Task:* ${taskText}
${assignedTo ? `*Assigned to:* ${assignedTo}` : ""}
*Deadline:* ${deadlineText}


_Powered by MindMe_`
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

  return await sendInteractiveReminder(
  chatId,
  message,
  token
)
  }

  export async function getWhatsappGroups() {
  if (!WHAPI_TOKEN) {
    throw new Error("WHAPI token missing")
  }

  const response = await fetch(
    `${WHAPI_URL}/groups`,
    {
      headers: {
        Authorization: `Bearer ${WHAPI_TOKEN}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    console.error("WHAPI GROUPS ERROR:", data)
    throw new Error("Failed to fetch groups")
  }

  const groups = data.groups || []

  const enrichedGroups = await Promise.all(
    groups.map(async (group: any) => {
      try {
        const detailsResponse = await fetch(
          `${WHAPI_URL}/groups/${group.id}`,
          {
            headers: {
              Authorization: `Bearer ${WHAPI_TOKEN}`,
            },
          }
        )

        const details = await detailsResponse.json()

        return {
          ...group,
          participants_count:
            details.participants_count ||
            details.participants?.length ||
            0,

          participants:
            details.participants || [],
        }
      } catch (error) {
        console.error(
          `Failed to fetch details for group ${group.id}`,
          error
        )

        return group
      }
    })
  )

  return {
    ...data,
    groups: enrichedGroups,
  }
}