import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"

export async function getGroupDetailData(groupId: string) {
  try {
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

    console.log("GROUP DETAIL FETCH:", { groupId, orgId }) 
    
    if (!orgId) throw new Error("No organisation ID found")

    const group = await sanityClient.fetch(
      `*[_type == "group" && _id == $groupId && organisation._ref == $orgId][0] {
        _id, name, chatId, isMonitoring, messagesCount, tasksExtracted,
        lastMessageAt, createdAt, participants, description,
        "pendingCount": count(*[_type == "task" && group._ref == ^._id && status == "pending"]),
        "completedCount": count(*[_type == "task" && group._ref == ^._id && status == "completed"]),
        "totalTasks": count(*[_type == "task" && group._ref == ^._id])
      }`,
      { groupId, orgId }
    )

    if (!group) return { group: null, tasks: [], notifications: [], messages: [] }

    const tasks = await sanityClient.fetch(
      `*[_type == "task" && group._ref == $groupId] | order(createdAt desc)[0...20] {
        _id, taskText, assignedTo, deadline, urgency, status,
        source, whatsappStatus, originalMessage, confidence, createdAt
      }`,
      { groupId }
    )

    const notifications = await sanityClient.fetch(
      `*[_type == "notification" && organisation._ref == $orgId] | order(createdAt desc)[0...10] {
        _id, channel, status, recipient, message,
        triggerReason, sentAt, createdAt, "taskText": task->taskText
      }`,
      { orgId }
    )

    const messages = await sanityClient.fetch(
      `*[_type == "message" && group._ref == $groupId] | order(timestamp desc)[0...20] {
        _id, text, sender, timestamp, isTask
      }`,
      { groupId }
    )

    return { group, tasks, notifications, messages }
  } catch (error) {
    console.error("Group detail data fetch error:", error)
    return { group: null, tasks: [], notifications: [], messages: [] }
  }
}