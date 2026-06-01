export const organisation = {
  name: "organisation",
  title: "Organisation",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
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
      name: "plan",
      title: "Plan",
      type: "string",
      options: { list: ["free", "pro", "enterprise"] },
      initialValue: "free",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "responseRate",
      title: "Response Rate",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
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
        { name: "whatsapp", title: "WhatsApp Reminders", type: "boolean", initialValue: true },
        { name: "email", title: "Email Reminders", type: "boolean", initialValue: false },
        { name: "urgentOnly", title: "Urgent Only", type: "boolean", initialValue: false },
      ],
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    },
  ],
}