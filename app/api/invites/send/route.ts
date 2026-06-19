import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import crypto from "crypto"

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits.slice(2)
  }

  return digits
}

export async function POST(
  request: Request
) {
  try {
    const {
      phone,
      role,
      groupId,
    } = await request.json()

    console.log("INVITE REQUEST:", {
      phone,
      role,
      groupId,
    })

    if (!phone || !role || !groupId) {
      return NextResponse.json(
        {
          error: "Missing fields",
        },
        {
          status: 400,
        }
      )
    }

    const normalizedPhone =
      normalizePhone(phone)

    if (
      normalizedPhone.length !== 10
    ) {
      return NextResponse.json(
        {
          error:
            "Phone number must contain exactly 10 digits",
        },
        {
          status: 400,
        }
      )
    }

    const allowedRoles = [
      "admin",
      "manager",
      "member",
      "guest",
    ]

    if (
      !allowedRoles.includes(role)
    ) {
      return NextResponse.json(
        {
          error: "Invalid role",
        },
        {
          status: 400,
        }
      )
    }

    const group = await sanityClient.fetch(
  `
  *[_type=="group" && _id==$groupId][0]{
    _id,
    name,
    chatId,
    members
  }
  `,
  { groupId }
)

    if (!group) {
      return NextResponse.json(
        {
          error: "Group not found",
        },
        {
          status: 404,
        }
      )
    }

    const exists =
      group.members?.some(
        (member: any) =>
          normalizePhone(
            member.phone || ""
          ) === normalizedPhone
      )

    console.log(
      "NORMALIZED INPUT:",
      normalizedPhone
    )

    console.log(
      "EXISTS:",
      exists
    )

    if (exists) {
      return NextResponse.json(
        {
          error:
            "Member already exists in this group",
        },
        {
          status: 400,
        }
      )
    }

    const inviteToken =
  crypto.randomUUID()

console.log(
  "INVITE TOKEN:",
  inviteToken
)

    const token = crypto.randomUUID()

await sanityClient.create({
  _type: "invite",

  phone: normalizedPhone,
  role,

  status: "pending",

  token,

  group: {
    _type: "reference",
    _ref: groupId,
  },

  sentAt: new Date().toISOString(),

  expiresAt: new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString(),

  createdAt: new Date().toISOString(),
})

return NextResponse.json({
  success: true,
  message: "Invite created successfully",
})
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to process invite",
      },
      {
        status: 500,
      }
    )
  }
}