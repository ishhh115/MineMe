export const message = {
  name: "message",
  title: "Raw Message",
  type: "document",
  fields: [
    {
      name: "organisation",
      title: "Organisation",
      type: "reference",
      to: [{ type: "organisation" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "group",
      title: "Group",
      type: "reference",
      to: [{ type: "group" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "messageId",
      title: "Message ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "chatId",
      title: "Chat ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "sender",
      title: "Sender Phone",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "text",
      title: "Message Text",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "timestamp",
      title: "Timestamp",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "isTask",
      title: "Is Task",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "processed",
      title: "Processed",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    },
  ],
}