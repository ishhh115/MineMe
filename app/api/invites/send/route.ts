import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { sendWhatsAppMessage } from "@/lib/whapi"
import crypto from "crypto"

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2)
  }
  return digits
}

export async function POST(request: Request) {
  try {
    const { phone, role, groupId } = await request.json()

    console.log("INVITE REQUEST:", { phone, role, groupId })

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
      `*[_type=="group" && _id==$groupId][0]{
        _id,
        name,
        chatId,
        members,
        "organisationId": organisation._ref
      }`,
      { groupId }
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

    console.log("NORMALIZED INPUT:", normalizedPhone)
    console.log("EXISTS:", exists)

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
    const whatsappChatId = `91${normalizedPhone}@s.whatsapp.net`

    const message = `👋 You've been invited to join *${group.name}* on MindMe!

MindMe automatically extracts tasks from WhatsApp conversations and helps your team stay on top of deadlines.

Your role: *${role}*

Sign up here to access the dashboard:
${appUrl}/signup

This invite expires in 7 days.

_Powered by MindMe_`

    const whatsappResult = await sendWhatsAppMessage(whatsappChatId, message)

    console.log("WHATSAPP INVITE RESULT:", whatsappResult)

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