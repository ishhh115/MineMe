import type { Rule } from "sanity";

export const organisation = {
  name: "organisation",
  title: "Organisation",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "whapiToken",
      title: "Whapi API Token",
      type: "string",
    },
    {
      name: "botPhoneNumber",
      title: "Bot Phone Number",
      type: "string",
    },
    {
      name: "webhookUrl",
      title: "Webhook URL",
      type: "string",
    },
    {
  name: "inviteCode",
  title: "Invite Code",
  type: "string",
  description: "Unique code for claiming WhatsApp groups. Send /connect <code> in a WhatsApp group to link it.",
  validation: (rule: Rule) => rule.required(),
},
    {
      name: "plan",
      title: "Plan",
      type: "string",
      options: { list: ["free", "pro", "enterprise"] },
      initialValue: "free",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "responseRate",
      title: "Response Rate",
      type: "number",
      initialValue: 0,
      validation: (rule: Rule) => rule.min(0).max(100),
    },
    {
      name: "totalMessagesSent",
      title: "Total Messages Sent",
      type: "number",
      initialValue: 0,
    },
    {
      name: "totalRemindersDelivered",
      title: "Total Reminders Delivered",
      type: "number",
      initialValue: 0,
    },
    {
      name: "notificationPreferences",
      title: "Notification Preferences",
      type: "object",
      fields: [
        {
          name: "whatsapp",
          title: "WhatsApp Reminders",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "email",
          title: "Email Reminders",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "urgentOnly",
          title: "Urgent Only",
          type: "boolean",
          initialValue: false,
        },
      ],
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
    },
  ],
};