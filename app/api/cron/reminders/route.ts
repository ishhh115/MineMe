import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { sendTaskReminder } from "@/lib/whapi"
import { sendEmail, taskReminderTemplate } from "@/lib/email"

// This route is called by Vercel Cron every hour
// It checks for tasks with approaching deadlines and sends reminders
export async function GET(request: Request) {
  try {
    // Verify this is called by Vercel Cron or internally
    const authHeader = request.headers.get("authorization")
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    // Get all organisations
    const organisations = await sanityClient.fetch(
      `*[_type == "organisation"] { _id, notificationPreferences, whapiToken }`
    )

    let totalReminders = 0
    let totalFailed = 0

    for (const org of organisations) {
      // Get tasks that need reminders for this org
      const tasks = await sanityClient.fetch(
        `*[_type == "task" 
          && organisation._ref == $orgId
          && status == "pending"
          && whatsappStatus != "completed_via_whatsapp"
          && deadline >= $now
          && deadline <= $twoHoursLater
          && (reminderSentAt == null || reminderSentAt < $oneHourAgo)
        ] {
          _id,
          taskText,
          assignedTo,
          assignedToPhone,
          deadline,
          urgency,
          sender,
          "chatId": group->chatId,
          "groupName": group->name
        }`,
        {
          orgId: org._id,
          now: now.toISOString(),
          twoHoursLater: twoHoursLater.toISOString(),
          oneHourAgo: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        }
      )

      for (const task of tasks) {
        try {
          // Send WhatsApp reminder if enabled
          if (org.notificationPreferences?.whatsapp && task.chatId) {
            const waResult = await sendTaskReminder({
              chatId: task.chatId,
              taskText: task.taskText,
              assignedTo: task.assignedTo,
              deadline: task.deadline,
              groupName: task.groupName,
              urgency: task.urgency,
              token: org.whapiToken || undefined,
            })

            if (waResult.success) {
              // Save notification to Sanity
              await sanityClient.create({
                _type: "notification",
                organisation: { _type: "reference", _ref: org._id },
                task: { _type: "reference", _ref: task._id },
                channel: "whatsapp",
                status: "delivered",
                recipient: task.chatId,
                message: `Reminder sent for: ${task.taskText}`,
                triggerReason: "approaching_deadline",
                scheduledAt: now.toISOString(),
                sentAt: now.toISOString(),
                deliveredAt: now.toISOString(),
                retryCount: 0,
                createdAt: now.toISOString(),
              })

              // Update task reminder sent time and whatsapp status
              await sanityClient
                .patch(task._id)
                .set({
                  reminderSentAt: now.toISOString(),
                  whatsappStatus: "awaiting_response",
                })
                .commit()

              totalReminders++
            }
          }

          // Send email reminder if enabled
          if (org.notificationPreferences?.email && task.sender) {
            const emailResult = await sendEmail({
              to: task.sender,
              subject: `MineMe Reminder: ${task.taskText}`,
              htmlBody: taskReminderTemplate({
                taskText: task.taskText,
                assignedTo: task.assignedTo || "Unassigned",
                deadline: task.deadline
                  ? new Date(task.deadline).toLocaleString()
                  : "No deadline",
                groupName: task.groupName || "Unknown Group",
                urgency: task.urgency,
              }),
            })

            if (emailResult.success) {
              await sanityClient.create({
                _type: "notification",
                organisation: { _type: "reference", _ref: org._id },
                task: { _type: "reference", _ref: task._id },
                channel: "email",
                status: "delivered",
                recipient: task.sender,
                message: `Email reminder sent for: ${task.taskText}`,
                triggerReason: "approaching_deadline",
                scheduledAt: now.toISOString(),
                sentAt: now.toISOString(),
                deliveredAt: now.toISOString(),
                retryCount: 0,
                createdAt: now.toISOString(),
              })

              totalReminders++
            }
          }
        } catch (taskError) {
          console.error(`Failed to send reminder for task ${task._id}:`, taskError)
          totalFailed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminders processed`,
      totalReminders,
      totalFailed,
      processedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ message: "Cron job failed" }, { status: 500 })
  }
}