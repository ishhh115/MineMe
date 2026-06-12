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
    const twoHoursLater = new Date(
  now.getTime() + 24 * 60 * 60 * 1000
)

    console.log("NOW:", now.toISOString())
console.log("TWO HOURS LATER:", twoHoursLater.toISOString())


    const organisations = await sanityClient.fetch(
      `*[_type == "organisation"] { _id, notificationPreferences, whapiToken }`
    )

    let totalReminders = 0
    let totalFailed = 0

    for (const org of organisations) {

      console.log("================================")
  console.log("ORG:", org._id)
  console.log("WHAPI TOKEN:", org.whapiToken)
  console.log("PREFS:", org.notificationPreferences)


  console.log("CHECKING ORG:", org._id)

const taskCount = await sanityClient.fetch(
  `count(*[_type == "task" && organisation._ref == $orgId])`,
  { orgId: org._id }
)

console.log("TASK COUNT:", taskCount)


      // Get tasks that need reminders for this org
 const tasks = await sanityClient.fetch(
  `*[
    _type == "task"
    && organisation._ref == $orgId
    && status == "pending"
    && reminderAt <= $now
    && !defined(reminderSentAt)
  ]{
    _id,
    taskText,
    assignedTo,
    assignedToPhone,
    deadline,
    urgency,
    sender,
    reminderAt,
    reminderSentAt,
    "chatId": group->chatId,
    "groupName": group->name
  }`,
  {
    orgId: org._id,
    now: now.toISOString(),
  }
)
      console.log("ORG:", org._id)
console.log("TASKS FOUND:", tasks.length)
for (const task of tasks) {
  console.log("TASK:", task.taskText)
  console.log("DEADLINE:", task.deadline)
}


      for (const task of tasks) {
        console.log("CHAT ID:", task.chatId)
console.log("GROUP NAME:", task.groupName)
        try {
          // Send WhatsApp reminder if enabled
          //if (org.notificationPreferences?.whatsapp && task.chatId) {
          if (task.chatId) {

            console.log("REMINDER TARGET:", task.chatId)
  console.log("TOKEN BEING USED:", org.whapiToken)

            const waResult = await sendTaskReminder({
              chatId: task.chatId,
              taskText: task.taskText,
              assignedTo: task.assignedTo,
              deadline: task.deadline,
              groupName: task.groupName,
              urgency: task.urgency,
              //token: org.whapiToken || undefined,
              token: org.whapiToken || process.env.WHAPI_API_TOKEN,
            })
            console.log("WA RESULT:", waResult)

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

        /*  // Send email reminder if enabled
          if (org.notificationPreferences?.email && task.sender) {
            const emailResult = await sendEmail({
              to: task.sender,
              subject: `MindMe Reminder: ${task.taskText}`,
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
          }*/
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