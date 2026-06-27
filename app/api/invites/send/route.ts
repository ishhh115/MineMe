import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { sendWhatsAppMessage } from "@/lib/whapi"
import crypto from "crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2)
  }
  return digits
}

export async function POST(request: Request) {
  try {

    const session = await getServerSession(authOptions)

    const user = session?.user as
      | {
          organisationId?: string
          role?: string
        }
      | undefined

    const organisationId = user?.organisationId
    const currentRole = user?.role

    if (!organisationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (
      currentRole !== "admin" &&
      currentRole !== "manager"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { phone, role, groupId } = await request.json()



    if (!phone || !role || !groupId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Phone number must contain exactly 10 digits" },
        { status: 400 }
      )
    }

    const allowedRoles = ["admin", "manager", "member", "guest"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Fetch group and its organisation
    const group = await sanityClient.fetch(
  `*[
      _type=="group" &&
      _id==$groupId &&
      organisation._ref==$organisationId
    ][0]{
      _id,
      name,
      chatId,
      members,
      "organisationId": organisation._ref
    }`,
      {
  groupId,
  organisationId,
}
    )

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    if (!group.organisationId) {
      return NextResponse.json({ error: "Group has no organisation" }, { status: 400 })
    }

    // Check if already a member
    const exists = group.members?.some(
      (member: any) => normalizePhone(member.phone || "") === normalizedPhone
    )



    if (exists) {
      return NextResponse.json(
        { error: "Member already exists in this group" },
        { status: 400 }
      )
    }

    // Generate token
    const token = crypto.randomUUID()

    // Save invite to Sanity
    await sanityClient.create({
      _type: "invite",
      organisation: {
        _type: "reference",
        _ref: group.organisationId,
      },
      group: {
        _type: "reference",
        _ref: groupId,
      },
      phone: normalizedPhone,
      role,
      status: "pending",
      token,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    })

    // Send WhatsApp message to invited person
    const appUrl = process.env.NEXTAUTH_URL || "https://mindme.in"
    const whatsappChatId = `91${normalizedPhone}`

    const message = `👋 You've been invited to join *${group.name}* on MindMe!

MindMe automatically extracts tasks from WhatsApp conversations and helps your team stay on top of deadlines.

Your role: *${role}*

Sign up here to access the dashboard:
${appUrl}/signup

This invite expires in 7 days.

_Powered by MindMe_`

    const whatsappResult = await sendWhatsAppMessage(whatsappChatId, message)



    // Don't fail the invite if WhatsApp send fails — invite is saved either way
    return NextResponse.json({
      success: true,
      message: "Invite sent successfully",
      whatsappDelivered: whatsappResult.success,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to process invite" }, { status: 500 })
  }
}