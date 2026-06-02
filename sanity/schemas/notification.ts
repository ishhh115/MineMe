import type { Rule } from "sanity";

export const notification = {
  name: "notification",
  title: "Notification",
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
      name: "task",
      title: "Task",
      type: "reference",
      to: [{ type: "task" }],
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "channel",
      title: "Channel",
      type: "string",
      options: { list: ["whatsapp", "email"] },
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["pending", "sent", "delivered", "failed", "retrying", "cancelled"],
      },
      initialValue: "pending",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "recipient",
      title: "Recipient",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "message",
      title: "Notification Message",
      type: "text",
    },
    {
      name: "triggerReason",
      title: "Trigger Reason",
      type: "string",
      options: {
        list: [
          "approaching_deadline",
          "missed_deadline",
          "manual_trigger",
          "upcoming_meeting",
        ],
      },
    },
    {
      name: "nextReminderAt",
      title: "Next Reminder Scheduled At",
      type: "datetime",
    },
    {
      name: "scheduledAt",
      title: "Scheduled At",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "sentAt",
      title: "Sent At",
      type: "datetime",
    },
    {
      name: "deliveredAt",
      title: "Delivered At",
      type: "datetime",
    },
    {
      name: "retryCount",
      title: "Retry Count",
      type: "number",
      initialValue: 0,
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
    },
  ],
};