import type { Rule } from "sanity";

export const group = {
  name: "group",
  title: "Group",
  type: "document",
  fields: [
    {
      name: "organisation",
      title: "Organisation",
      type: "reference",
      to: [{ type: "organisation" }],
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "chatId",
      title: "Chat ID",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "name",
      title: "Group Name",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "participants",
      title: "Participants Count",
      type: "number",
      initialValue: 0,
    },
    {
      name: "members",
      title: "Members",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Name", type: "string" },
            { name: "phone", title: "Phone", type: "string" },
            { name: "initials", title: "Initials", type: "string" },
          ],
        },
      ],
    },
    {
      name: "isMonitoring",
      title: "Is Monitoring",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "health",
      title: "Health Status",
      type: "string",
      options: {
        list: [
          "active",
          "high_activity",
          "deadline_risk",
          "reminder_heavy",
          "quiet",
        ],
      },
      initialValue: "active",
    },
    {
      name: "messagesCount",
      title: "Messages Count Today",
      type: "number",
      initialValue: 0,
    },
    {
      name: "tasksExtracted",
      title: "Tasks Extracted",
      type: "number",
      initialValue: 0,
    },
    {
      name: "completedTasksCount",
      title: "Completed Tasks Count",
      type: "number",
      initialValue: 0,
    },
    {
      name: "completionPercentage",
      title: "Completion Percentage",
      type: "number",
      initialValue: 0,
      validation: (rule: Rule) => rule.min(0).max(100),
    },
    {
      name: "latestExtractedMessage",
      title: "Latest Extracted Message",
      type: "text",
    },
    {
      name: "overdueCount",
      title: "Overdue Tasks Count",
      type: "number",
      initialValue: 0,
    },
    {
      name: "lastMessageAt",
      title: "Last Message At",
      type: "datetime",
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
    },
  ],
};