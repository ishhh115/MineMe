import type { Rule } from "sanity";

export const invite = {
  name: "invite",
  title: "Invite",
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
      name: "email",
      title: "Email",
      type: "string",
    },

    {
      name: "phone",
      title: "Phone",
      type: "string",
    },

    {
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          "admin",
          "manager",
          "member",
          "guest",
        ],
      },
      validation: (rule: Rule) => rule.required(),
    },

    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          "pending",
          "accepted",
          "expired",
          "revoked",
        ],
      },
      initialValue: "pending",
    },

    {
      name: "token",
      title: "Invite Token",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },

    {
      name: "invitedBy",
      title: "Invited By",
      type: "reference",
      to: [{ type: "user" }],
    },

    {
      name: "sentAt",
      title: "Sent At",
      type: "datetime",
    },

    {
      name: "acceptedAt",
      title: "Accepted At",
      type: "datetime",
    },

    {
      name: "expiresAt",
      title: "Expires At",
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