import { sanityClient } from "./sanity"
import { sendTaskReminder } from "./whapi"
import { sendEmail, taskReminderTemplate } from "./email"

// Get dashboard stats
export async function getDashboardStats(organisationId: string) {
  const stats = await sanityClient.fetch(
    `{
      "totalTasks": count(*[_type == "task" && organisation._ref == $orgId && status == "pending"]),
      "pendingTasks": count(*[_type == "task" && organisation._ref == $orgId && status == "pending"]),
      "urgentTasks": count(*[_type == "task" && organisation._ref == $orgId && urgency == "high" && status == "pending"]),
      "completedViaWhatsapp": count(*[_type == "task" && organisation._ref == $orgId && whatsappStatus == "completed_via_whatsapp"]),
      "awaitingResponse": count(*[_type == "task" && organisation._ref == $orgId && whatsappStatus == "awaiting_response"]),
      "deliveryFailures": count(*[_type == "notification" && organisation._ref == $orgId && status == "failed"]),
"totalGroups": count(*[_type == "group" && organisation._ref == $orgId && isMonitoring == true]),

"totalRemindersDelivered": count(
  *[_type == "notification" &&
    organisation._ref == $orgId &&
    status == "delivered"]
),

"totalResponses": count(
  *[_type == "task" &&
    organisation._ref == $orgId &&
    whatsappStatus == "completed_via_whatsapp"]
)
    }`,
    { orgId: organisationId }
  )
  const responseRate =
  stats.totalRemindersDelivered > 0
    ? Math.round(
        (stats.totalResponses / stats.totalRemindersDelivered) * 100
      )
    : 0

console.log("DASHBOARD STATS:", {
  delivered: stats.totalRemindersDelivered,
  responses: stats.totalResponses,
  responseRate,
})

return {
  ...stats,
  responseRate,
}
  console.log("FETCHING STATS FOR:", organisationId)
}

// Get recent activity
export async function getRecentActivity(organisationId: string) {
  const tasks = await sanityClient.fetch(
    `*[
  _type == "task" &&
  organisation._ref == $orgId &&
  status == "pending"
] | order(createdAt desc)[0...10] {
      _id,
      taskText,
      urgency,
      status,
      deadline,
      whatsappStatus,
      originalMessage,
      assignedTo,
      createdAt,
      "groupName": group->name,
      "chatId": group->chatId
    }`,
    { orgId: organisationId }
  )
  console.log("RECENT ACTIVITY TASKS:")
console.log(tasks)
  return tasks
}

// Get upcoming deadlines
export async function getUpcomingDeadlines(organisationId: string) {
  const now = new Date().toISOString()
  const tasks = await sanityClient.fetch(
    `*[_type == "task" && organisation._ref == $orgId && deadline > $now && status != "completed"] | order(deadline asc) [0...5] {
      _id,
      taskText,
      urgency,
      deadline,
      "groupName": group->name
    }`,
    { orgId: organisationId, now }
  )

  console.log("UPCOMING DEADLINES:", tasks)

  return tasks
}



// Get group conversion stats
export async function getGroupConversion(organisationId: string) {
  const groups = await sanityClient.fetch(
    `*[_type == "group" && organisation._ref == $orgId && isMonitoring == true] {
      _id,
      name,
      messagesCount,
      tasksExtracted,
      completionPercentage
    }`,
    { orgId: organisationId }
  )
  return groups
}

// Get all tasks
export async function getTasks(organisationId: string) {
  const tasks = await sanityClient.fetch(
    `*[_type == "task" && organisation._ref == $orgId] | order(createdAt desc)[0...20] {
      _id,
      taskText,
      assignedTo,
      deadline,
      urgency,
      status,
      source,
      whatsappStatus,
      originalMessage,
      confidence,
      createdAt,
      "groupName": group->name,
      "chatId": group->chatId
    }`,
    { orgId: organisationId }
  )
  return tasks
}

// Get all groups
export async function getGroups(organisationId: string) {
  const groups = await sanityClient.fetch(
    `*[_type == "group" && organisation._ref == $orgId] | order(createdAt desc) {
      _id,
      name,
      chatId,
      participants,
      isMonitoring,
      health,
      messagesCount,
      tasksExtracted,
      completedTasksCount,
      completionPercentage,
      latestExtractedMessage,
      overdueCount,
      lastMessageAt,
      members
    }`,
    { orgId: organisationId }
  )
  return groups
}

// Get all notifications
export async function getNotifications(organisationId: string) {
  const notifications = await sanityClient.fetch(
    `*[_type == "notification" && organisation._ref == $orgId] | order(createdAt desc) {
      _id,
      channel,
      status,
      recipient,
      message,
      triggerReason,
      scheduledAt,
      sentAt,
      deliveredAt,
      retryCount,
      nextReminderAt,
      createdAt,
      "taskText": task->taskText,
      "taskUrgency": task->urgency
    }`,
    { orgId: organisationId }
  )
  return notifications
}

// Update task status
export async function updateTaskStatus(taskId: string, status: string) {
  console.log("UPDATING TASK:", taskId)
  console.log("NEW STATUS:", status)

  const result = await sanityClient
    .patch(taskId)
    .set({
      status,
      completedAt: new Date().toISOString(),
    })
    .commit()

  console.log("PATCH RESULT:", result)

  return result
}

// Snooze task
export async function snoozeTask(taskId: string, snoozeUntil: string) {
  return await sanityClient
    .patch(taskId)
    .set({ status: "snoozed", snoozeUntil })
    .commit()
}

// Create a notification to resend reminder (manual)
export async function resendReminder(taskId: string) {
  const task = await sanityClient.fetch(
    `*[_type == "task" && _id == $taskId][0]{
      _id,
      taskText,
      assignedTo,
      deadline,
      urgency,
      sender,
      "chatId": group->chatId,
      "groupName": group->name,
      "organisation": organisation->{_id, whapiToken, notificationPreferences}
    }`,
    { taskId }
  )

  if (!task) {
    throw new Error("Task not found")
  }

  const notifications: Array<{ channel: string; success: boolean; result: unknown }> = []

  if (task.organisation?.notificationPreferences?.whatsapp && task.chatId) {
    const whatsappResult = await sendTaskReminder({
      chatId: task.chatId,
      taskText: task.taskText,
      assignedTo: task.assignedTo,
      deadline: task.deadline,
      groupName: task.groupName,
      urgency: task.urgency,
      token: task.organisation?.whapiToken || undefined,
    })

    notifications.push({
      channel: "whatsapp",
      success: Boolean(whatsappResult.success),
      result: whatsappResult,
    })

    if (whatsappResult.success) {
      await sanityClient.create({
        _type: "notification",
        organisation: { _type: "reference", _ref: task.organisation._id },
        task: { _type: "reference", _ref: task._id },
        channel: "whatsapp",
        status: "delivered",
        recipient: task.chatId,
        message: `Reminder sent for: ${task.taskText}`,
        triggerReason: "manual_trigger",
        scheduledAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }

  if (task.organisation?.notificationPreferences?.email && task.sender) {
    const emailResult = await sendEmail({
      to: task.sender,
      subject: `MindMe Reminder: ${task.taskText}`,
      htmlBody: taskReminderTemplate({
        taskText: task.taskText,
        assignedTo: task.assignedTo || "Unassigned",
        deadline: task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline",
        groupName: task.groupName || "Unknown Group",
        urgency: task.urgency,
      }),
    })

    notifications.push({
      channel: "email",
      success: Boolean(emailResult.success),
      result: emailResult,
    })

    if (emailResult.success) {
      await sanityClient.create({
        _type: "notification",
        organisation: { _type: "reference", _ref: task.organisation._id },
        task: { _type: "reference", _ref: task._id },
        channel: "email",
        status: "delivered",
        recipient: task.sender,
        message: `Email reminder sent for: ${task.taskText}`,
        triggerReason: "manual_trigger",
        scheduledAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return {
    ok: true,
    taskId,
    notifications,
  }
}

// Edit a task's deadline
export async function editTaskDeadline(taskId: string, newDeadline: string) {
  return await sanityClient
    .patch(taskId)
    .set({ deadline: newDeadline })
    .commit()
}

// Reassign a task to a different user/assignee
export async function reassignTask(taskId: string, assignee: string) {
  return await sanityClient
    .patch(taskId)
    .set({ assignedTo: assignee })
    .commit()
}

// Delete a task
export async function deleteTask(taskId: string) {
  return await sanityClient.delete(taskId)
}

// Get users for an organisation
export async function getUsers(organisationId: string, q?: string) {
  if (q && q.trim().length > 0) {
    const qterm = `*${q.trim().toLowerCase()}*`
    const users = await sanityClient.fetch(
      `*[_type == "user" && organisation._ref == $orgId && (lower(name) match $qterm || lower(email) match $qterm)] | order(name asc) {
        _id,
        name,
        email,
        phone,
        role,
        avatar
      }`,
      { orgId: organisationId, qterm }
    )
    return users
  }

  const users = await sanityClient.fetch(
    `*[_type == "user" && organisation._ref == $orgId] | order(name asc) {
      _id,
      name,
      email,
      phone,
      role,
      avatar
    }`,
    { orgId: organisationId }
  )
  return users
}

export async function getTaskThroughput(organisationId: string) {
  const tasks = await sanityClient.fetch(
    `*[_type == "task" && organisation._ref == $orgId]{
      createdAt,
      completedAt,
      status
    }`,
    { orgId: organisationId }
  )

  return tasks
}