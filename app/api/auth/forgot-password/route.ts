import { randomInt } from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"
import { passwordResetTemplate, sendEmail } from "@/lib/email"
import { sendWhatsAppMessage } from "@/lib/whapi"

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json()

    if (!email && !phone) {
      return NextResponse.json(
        { message: "Email or phone number is required" },
        { status: 400 }
      )
    }

    const identifier = email || phone

    // Fetch user AND their organisation's whapiToken
    const user = await sanityClient.fetch(
      `*[
        _type == "user" &&
        (email == $identifier || phone == $identifier)
      ][0]{
        _id,
        name,
        email,
        phone,
        isVerified,
        "whapiToken": organisation->whapiToken
      }`,
      { identifier }
    )

    if (!user) {
      return NextResponse.json({
        message: "If the account exists, a reset code has been sent",
      })
    }

    const resetCode = randomInt(0, 1000000).toString().padStart(6, "0")
    const resetPasswordCodeHash = await bcrypt.hash(resetCode, 12)
    const resetPasswordCodeExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString()

    await sanityClient
      .patch(user._id)
      .set({ resetPasswordCodeHash, resetPasswordCodeExpiresAt })
      .commit()

    if (email) {
      const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?identifier=${encodeURIComponent(email)}`

      const emailResult = await sendEmail({
        to: email,
        subject: "Reset your MindMe password",
        htmlBody: passwordResetTemplate({
          name: user.name || "there",
          resetCode,
          resetLink,
        }),
      })

      if (!emailResult.success) {
        console.log("====================================")
        console.log("EMAIL NOT SENT — LOCAL DEVELOPMENT")
        console.log(`Password reset code for ${email}: ${resetCode}`)
        console.log("====================================")
      }
    }

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "")

      const whatsappPhone =
        normalizedPhone.length === 10
          ? `91${normalizedPhone}`
          : normalizedPhone

      // Use org's whapiToken, same as reminders
      const chatId = whatsappPhone

      console.log("WHATSAPP RESET TARGET:", chatId)
      console.log("USING ORG TOKEN:", user.whapiToken ? "yes" : "fallback to env")

      const result = await sendWhatsAppMessage(
        chatId,
        `🔐 *MindMe Password Reset*

Your reset code is:

*${resetCode}*

This code expires in 15 minutes.

If you did not request this, please ignore this message.`,
        { token: user.whapiToken || undefined }
      )

      console.log("WHATSAPP RESET RESULT:", result)

      if (process.env.NODE_ENV === "development") {
        console.log("====================================")
        console.log(`Password reset code for ${phone}: ${resetCode}`)
        console.log("====================================")
      }
    }

    return NextResponse.json({
      message: "If the account exists, a reset code has been sent",
      ...(process.env.NODE_ENV === "development"
        ? { devResetCode: resetCode }
        : {}),
    })
  } catch (error) {
    console.error("forgot-password error", error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}