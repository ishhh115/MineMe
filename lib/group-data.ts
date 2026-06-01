export type GroupHealth =
  | "Monitoring"
  | "High Activity"
  | "Quiet"
  | "Reminder Heavy"
  | "Deadline Risk"

export type GroupSummary = {
  id: number
  slug: string
  name: string
  category: string
  participants: number
  messagesToday: number
  tasksToday: number
  pendingTasks: number
  completedTasks: number
  extractionRate: number
  health: GroupHealth
  lastExtractedMessage: string
  lastSync: string
  webhookActive: boolean
  syncLabel: string
  members: string[]
  sparkline: number[]
  overdueTasks: number
  completionRate: number
  reminderSuccess: number
  deadlineLoad: number
}

export type GroupDetail = GroupSummary & {
  recentMessages: {
    time: string
    author: string
    text: string
  }[]
  extractedTasks: {
    title: string
    owner: string
    deadline: string
    status: "Pending" | "Completed"
  }[]
  deadlines: {
    title: string
    time: string
    priority: "High" | "Medium" | "Low"
  }[]
  reminderHistory: {
    time: string
    note: string
  }[]
  activityTimeline: {
    time: string
    title: string
    detail: string
  }[]
  analytics: {
    messageVolume: number[]
    extractionTrend: number[]
  }
}

export const groups: GroupDetail[] = [
  {
    id: 1,
    slug: "work-group",
    name: "Work Group",
    category: "Operations",
    participants: 12,
    messagesToday: 72,
    tasksToday: 8,
    pendingTasks: 6,
    completedTasks: 4,
    extractionRate: 11,
    health: "High Activity",
    lastExtractedMessage: "Rahul please send the report before 6 PM and share the final version in the group.",
    lastSync: "12s ago",
    webhookActive: true,
    syncLabel: "Webhook active",
    members: ["RG", "NP", "AM", "SK"],
    sparkline: [3, 4, 5, 4, 7, 8, 6, 9],
    overdueTasks: 2,
    completionRate: 67,
    reminderSuccess: 92,
    deadlineLoad: 78,
    recentMessages: [
      { time: "10:42 AM", author: "Rohit", text: "Rahul please send the report before 6 PM." },
      { time: "10:39 AM", author: "Neha", text: "Please update the timeline with the latest milestones." },
      { time: "09:58 AM", author: "Amit", text: "Share the project summary before EOD." },
    ],
    extractedTasks: [
      { title: "Submit Q3 report", owner: "Rahul", deadline: "Today, 6:00 PM", status: "Pending" },
      { title: "Update project timeline", owner: "Rahul", deadline: "Friday, EOD", status: "Pending" },
      { title: "Review proposal", owner: "Arjun", deadline: "Tomorrow, 10:00 AM", status: "Completed" },
    ],
    deadlines: [
      { title: "Q3 report", time: "Today, 6:00 PM", priority: "High" },
      { title: "Timeline update", time: "Friday, EOD", priority: "Medium" },
      { title: "Proposal review", time: "Tomorrow, 10:00 AM", priority: "Low" },
    ],
    reminderHistory: [
      { time: "10:40 AM", note: "Reminder sent to Rahul" },
      { time: "12:15 PM", note: "Follow-up reminder scheduled" },
      { time: "01:10 PM", note: "Seen by Rahul" },
    ],
    activityTimeline: [
      { time: "10:42 AM", title: "Message received", detail: "Report deadline mentioned in group chat" },
      { time: "10:40 AM", title: "Reminder sent", detail: "Automated reminder issued to assigned user" },
      { time: "10:18 AM", title: "Task extracted", detail: "Task created from WhatsApp message" },
    ],
    analytics: {
      messageVolume: [10, 14, 12, 18, 20, 16, 22],
      extractionTrend: [2, 3, 3, 4, 6, 7, 8],
    },
  },
  {
    id: 2,
    slug: "sales-team",
    name: "Sales Team",
    category: "Sales",
    participants: 8,
    messagesToday: 48,
    tasksToday: 4,
    pendingTasks: 3,
    completedTasks: 3,
    extractionRate: 8,
    health: "Deadline Risk",
    lastExtractedMessage: "Priya please call the client today before 3 PM and confirm pricing approval.",
    lastSync: "18s ago",
    webhookActive: true,
    syncLabel: "Webhook active",
    members: ["PR", "TN", "VK", "JS"],
    sparkline: [2, 3, 4, 4, 6, 5, 7, 8],
    overdueTasks: 1,
    completionRate: 50,
    reminderSuccess: 86,
    deadlineLoad: 88,
    recentMessages: [
      { time: "09:12 AM", author: "Priya", text: "Please call the client before 3 PM and share the pricing update." },
      { time: "09:04 AM", author: "Vikram", text: "Need the proposal approval by noon." },
      { time: "08:55 AM", author: "Sales Ops", text: "Reminder: follow up on pending client calls." },
    ],
    extractedTasks: [
      { title: "Call the client", owner: "Priya", deadline: "Today, 3:00 PM", status: "Pending" },
      { title: "Send proposal", owner: "Vikram", deadline: "Today, 4:30 PM", status: "Pending" },
      { title: "Update deal notes", owner: "Jenny", deadline: "Tomorrow, 11:00 AM", status: "Completed" },
    ],
    deadlines: [
      { title: "Client call", time: "Today, 3:00 PM", priority: "High" },
      { title: "Proposal approval", time: "Today, 4:30 PM", priority: "High" },
      { title: "Deal notes update", time: "Tomorrow, 11:00 AM", priority: "Medium" },
    ],
    reminderHistory: [
      { time: "09:10 AM", note: "Reminder sent to Priya" },
      { time: "11:35 AM", note: "Deadline alert pushed" },
      { time: "12:50 PM", note: "Follow-up reminder queued" },
    ],
    activityTimeline: [
      { time: "09:12 AM", title: "Client follow-up extracted", detail: "Deadline-heavy task detected from a sales conversation" },
      { time: "09:10 AM", title: "Reminder sent", detail: "Priority alert delivered to Priya" },
      { time: "08:58 AM", title: "Monitoring increased", detail: "More activity detected in the group" },
    ],
    analytics: {
      messageVolume: [6, 7, 8, 9, 10, 11, 12],
      extractionTrend: [1, 2, 2, 3, 3, 4, 4],
    },
  },
  {
    id: 3,
    slug: "finance",
    name: "Finance",
    category: "Finance",
    participants: 5,
    messagesToday: 34,
    tasksToday: 3,
    pendingTasks: 2,
    completedTasks: 5,
    extractionRate: 9,
    health: "Reminder Heavy",
    lastExtractedMessage: "Meera please send the invoice today and update the finance thread once it's done.",
    lastSync: "26s ago",
    webhookActive: true,
    syncLabel: "Webhook active",
    members: ["MR", "AD", "PK"],
    sparkline: [5, 5, 6, 6, 7, 8, 7, 9],
    overdueTasks: 0,
    completionRate: 71,
    reminderSuccess: 94,
    deadlineLoad: 42,
    recentMessages: [
      { time: "11:20 AM", author: "Meera", text: "Invoice can go out today after approval." },
      { time: "10:30 AM", author: "Accounts", text: "Reminder: payment cycle closes by evening." },
      { time: "09:50 AM", author: "Finance Lead", text: "Please confirm the outstanding entries." },
    ],
    extractedTasks: [
      { title: "Send invoice", owner: "Meera", deadline: "Today, 5:00 PM", status: "Completed" },
      { title: "Follow up payment", owner: "Accounts", deadline: "Today, 6:30 PM", status: "Pending" },
      { title: "Reconcile entries", owner: "Priya", deadline: "Tomorrow, 12:00 PM", status: "Pending" },
    ],
    deadlines: [
      { title: "Invoice send", time: "Today, 5:00 PM", priority: "High" },
      { title: "Payment follow-up", time: "Today, 6:30 PM", priority: "Medium" },
      { title: "Reconciliation", time: "Tomorrow, 12:00 PM", priority: "Low" },
    ],
    reminderHistory: [
      { time: "09:15 AM", note: "Invoice reminder sent" },
      { time: "10:42 AM", note: "Payment follow-up scheduled" },
      { time: "01:05 PM", note: "Completion confirmed" },
    ],
    activityTimeline: [
      { time: "11:20 AM", title: "Invoice task extracted", detail: "Finance message converted into a tracked action" },
      { time: "09:15 AM", title: "Reminder sent", detail: "Billing reminder issued to accounts" },
      { time: "08:48 AM", title: "Webhook synced", detail: "Latest group activity pulled into dashboard" },
    ],
    analytics: {
      messageVolume: [4, 5, 5, 6, 7, 6, 8],
      extractionTrend: [1, 1, 2, 2, 2, 3, 3],
    },
  },
  {
    id: 4,
    slug: "operations",
    name: "Operations",
    category: "Operations",
    participants: 9,
    messagesToday: 32,
    tasksToday: 2,
    pendingTasks: 2,
    completedTasks: 2,
    extractionRate: 6,
    health: "Quiet",
    lastExtractedMessage: "Need a room booked for the team review tomorrow morning.",
    lastSync: "41s ago",
    webhookActive: true,
    syncLabel: "Webhook active",
    members: ["OP", "RS", "VA"],
    sparkline: [2, 2, 3, 2, 4, 4, 3, 4],
    overdueTasks: 0,
    completionRate: 50,
    reminderSuccess: 88,
    deadlineLoad: 35,
    recentMessages: [
      { time: "08:15 AM", author: "Ops Desk", text: "Need a room booked for tomorrow's team review." },
      { time: "08:02 AM", author: "Nina", text: "Checklist for onboarding needs one final review." },
      { time: "07:50 AM", author: "Ops Lead", text: "Please keep the team updated on the rollout." },
    ],
    extractedTasks: [
      { title: "Book meeting room", owner: "Sneha", deadline: "Tomorrow, 9:00 AM", status: "Pending" },
      { title: "Review onboarding checklist", owner: "Nina", deadline: "Today, 4:00 PM", status: "Completed" },
      { title: "Update rollout note", owner: "Ops Lead", deadline: "Friday, EOD", status: "Pending" },
    ],
    deadlines: [
      { title: "Meeting room booking", time: "Tomorrow, 9:00 AM", priority: "Medium" },
      { title: "Onboarding review", time: "Today, 4:00 PM", priority: "Low" },
      { title: "Rollout note", time: "Friday, EOD", priority: "Medium" },
    ],
    reminderHistory: [
      { time: "08:20 AM", note: "Reminder sent to Sneha" },
      { time: "09:05 AM", note: "Checklist reminder queued" },
      { time: "10:10 AM", note: "Ops follow-up logged" },
    ],
    activityTimeline: [
      { time: "08:15 AM", title: "Task extracted", detail: "Room booking request converted from chat" },
      { time: "08:10 AM", title: "Webhook synced", detail: "Group activity pulled into the system" },
      { time: "07:50 AM", title: "Low activity detected", detail: "Quiet monitoring state recorded" },
    ],
    analytics: {
      messageVolume: [3, 3, 4, 3, 4, 5, 4],
      extractionTrend: [1, 1, 1, 1, 2, 2, 2],
    },
  },
]

export const groupSummaries = groups.map((group) => ({
  id: group.id,
  slug: group.slug,
  name: group.name,
  category: group.category,
  participants: group.participants,
  messagesToday: group.messagesToday,
  tasksToday: group.tasksToday,
  pendingTasks: group.pendingTasks,
  completedTasks: group.completedTasks,
  extractionRate: group.extractionRate,
  health: group.health,
  lastExtractedMessage: group.lastExtractedMessage,
  lastSync: group.lastSync,
  webhookActive: group.webhookActive,
  syncLabel: group.syncLabel,
  members: group.members,
  sparkline: group.sparkline,
  overdueTasks: group.overdueTasks,
  completionRate: group.completionRate,
  reminderSuccess: group.reminderSuccess,
  deadlineLoad: group.deadlineLoad,
}))

export function getGroupBySlug(slug: string) {
  return groups.find((group) => group.slug === slug)
}
