import type { Rule } from "sanity";

export const task = {
  name: "task",
  title: "Task",
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
      name: "group",
      title: "Group",
      type: "reference",
      to: [{ type: "group" }],
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "taskText",
      title: "Task Text",
      type: "string",
      validation: (rule: Rule) => rule.required().min(3),
    },
    {
      name: "assignedTo",
      title: "Assigned To",
      type: "string",
    },
    {
      name: "assignedToPhone",
      title: "Assigned To Phone",
      type: "string",
    },
    {
      name: "deadline",
      title: "Deadline",
      type: "datetime",
    },
    {
      name: "urgency",
      title: "Urgency",
      type: "string",
      options: { list: ["high", "medium", "low"] },
      initialValue: "low",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["pending", "completed", "snoozed", "cancelled"] },
      initialValue: "pending",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "source",
      title: "Source",
      type: "string",
      options: { list: ["ai", "manual"] },
      initialValue: "ai",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "whatsappStatus",
      title: "WhatsApp Status",
      type: "string",
      options: {
        list: [
          "pending",
          "awaiting_response",
          "completed_via_whatsapp",
          "no_response",
          "snoozed",
        ],
      },
      initialValue: "pending",
    },
    {
      name: "originalMessage",
      title: "Original WhatsApp Message",
      type: "text",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "messageId",
      title: "Message ID",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "webhookId",
      title: "Webhook ID",
      type: "string",
    },
    {
      name: "sender",
      title: "Sender Phone",
      type: "string",
    },
    {
      name: "confidence",
      title: "Extraction Confidence",
      type: "number",
      validation: (rule: Rule) => rule.min(0).max(1),
    },
    {
      name: "timeline",
      title: "Task Timeline",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "event", title: "Event", type: "string" },
            { name: "timestamp", title: "Timestamp", type: "datetime" },
            { name: "actor", title: "Actor", type: "string" },
          ],
        },
      ],
    },
    {
      name: "actionsLog",
      title: "Admin Actions Log",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "action", title: "Action", type: "string" },
            { name: "performedBy", title: "Performed By", type: "string" },
            { name: "timestamp", title: "Timestamp", type: "datetime" },
            { name: "note", title: "Note", type: "string" },
          ],
        },
      ],
    },
    {
      name: "reminderSentAt",
      title: "Reminder Sent At",
      type: "datetime",
    },
    {
      name: "completedAt",
      title: "Completed At",
      type: "datetime",
    },
    {
      name: "snoozeUntil",
      title: "Snoozed Until",
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