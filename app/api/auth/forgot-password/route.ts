import { randomInt } from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"
import { passwordResetTemplate, sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const user = await sanityClient.fetch(
      `*[_type == "user" && email == $email][0]{ _id, name, email, isVerified }`,
      { email }
    )

    if (!user) {
      // Return success even if user not found for security
      return NextResponse.json({ message: "If the email exists, a reset code has been sent" })
    }

    const resetCode = randomInt(0, 1000000).toString().padStart(6, "0")
    const resetPasswordCodeHash = await bcrypt.hash(resetCode, 12)
    const resetPasswordCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await sanityClient
      .patch(user._id)
      .set({ resetPasswordCodeHash, resetPasswordCodeExpiresAt })
      .commit()

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?email=${encodeURIComponent(email)}`

    const emailResult = await sendEmail({
      to: email,
      subject: "Reset your MindMe password",
      htmlBody: passwordResetTemplate({
        name: user.name || "there",
        resetCode,
        resetLink,
      }),
    })

    // Log reset code locally when email fails
    if (!emailResult.success) {
      console.log("====================================")
      console.log("EMAIL NOT SENT — LOCAL DEVELOPMENT")
      console.log(`Password reset code for ${email}: ${resetCode}`)
      console.log(`Reset link: ${resetLink}`)
      console.log("====================================")
    }

    // Always return success regardless of email result
    return NextResponse.json({
      message: "If the email exists, a reset code has been sent",
      ...(process.env.NODE_ENV === "development" && !emailResult.success
        ? { devResetCode: resetCode }
        : {}),
    })
  } catch (error) {
    console.error("forgot-password error", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}