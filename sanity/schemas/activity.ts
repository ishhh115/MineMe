import type { Rule } from "sanity"

export const activity = {
  name: "activity",
  title: "Activity",
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
      name: "type",
      title: "Type",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },

    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },

    {
      name: "description",
      title: "Description",
      type: "string",
    },

    {
      name: "group",
      title: "Group",
      type: "reference",
      to: [{ type: "group" }],
    },

    {
      name: "task",
      title: "Task",
      type: "reference",
      to: [{ type: "task" }],
    },

    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (rule: Rule) => rule.required(),
    },
  ],
}