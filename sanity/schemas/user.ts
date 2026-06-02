import type { Rule } from "sanity";

export const user = {
  name: "user",
  title: "User",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule: Rule) => rule.required().email(),
    },
    {
      name: "phone",
      title: "WhatsApp Phone Number",
      type: "string",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "organisation",
      title: "Organisation",
      type: "reference",
      to: [{ type: "organisation" }],
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: ["admin", "manager", "member", "guest"],
      },
      initialValue: "member",
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: "isVerified",
      title: "Phone Verified",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "verificationCodeHash",
      title: "Verification Code Hash",
      type: "string",
    },
    {
      name: "verificationCodeExpiresAt",
      title: "Verification Code Expires At",
      type: "datetime",
    },
    {
      name: "resetPasswordCodeHash",
      title: "Reset Password Code Hash",
      type: "string",
    },
    {
      name: "resetPasswordCodeExpiresAt",
      title: "Reset Password Code Expires At",
      type: "datetime",
    },
    {
      name: "avatar",
      title: "Avatar",
      type: "string",
    },
    {
      name: "lastActiveAt",
      title: "Last Active At",
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