import type { Rule } from "sanity";

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
      name: "messageId",
      title: "Message ID",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "chatId",
      title: "Chat ID",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "sender",
      title: "Sender Phone",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "text",
      title: "Message Text",
      type: "text",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "timestamp",
      title: "Timestamp",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
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
      validation: (rule: Rule) => rule.required(),
    },
  ],
};