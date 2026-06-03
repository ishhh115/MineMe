import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"
import { sendEmail, verificationCodeTemplate } from "@/lib/email"
import { verifyRecaptcha } from "@/lib/recaptcha"

export async function POST(request: Request) {
  try {
    const { name, phone, email, password } = await request.json()

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationCode = randomInt(0, 1000000).toString().padStart(6, "0")
    const verificationCodeHash = await bcrypt.hash(verificationCode, 12)
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const existing = await sanityClient.fetch(
      `*[_type == "user" && (phone == $phone || email == $email)][0]`,
      { phone, email }
    )

    if (existing) {
      return NextResponse.json(
        { message: "User with this phone or email already exists" },
        { status: 409 }
      )
    }

    const orgName = `${name}'s Organisation`
    const orgSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-")

    const newOrg = await sanityClient.create({
      _type: "organisation",
      name: orgName,
      slug: {
        _type: "slug",
        current: `${orgSlug}-${Date.now()}`,
      },
      plan: "free",
      responseRate: 0,
      totalMessagesSent: 0,
      totalRemindersDelivered: 0,
      notificationPreferences: {
        whatsapp: true,
        email: false,
        urgentOnly: false,
      },
      createdAt: new Date().toISOString(),
    })

    const newUser = await sanityClient.create({
      _type: "user",
      name,
      phone,
      email,
      password: hashedPassword,
      organisation: { _type: "reference", _ref: newOrg._id },
      role: "admin",
      isVerified: false,
      verificationCodeHash,
      verificationCodeExpiresAt,
      createdAt: new Date().toISOString(),
    })

    // Try to send verification email but do not block registration if it fails
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your MindMe account",
      htmlBody: verificationCodeTemplate({
        name,
        verificationCode,
      }),
    })

    // Log verification code locally for testing when email is not available
    if (!emailResult.success) {
      console.log("====================================")
      console.log("EMAIL NOT SENT — LOCAL DEVELOPMENT")
      console.log(`Verification code for ${email}: ${verificationCode}`)
      console.log("====================================")
    }

    return NextResponse.json(
      {
        message: "Account created successfully. Check your email for the OTP.",
        user: {
          id: newUser._id,
          name,
          phone,
          email,
          organisationId: newOrg._id,
        },
        // Only include code in development for testing
        ...(process.env.NODE_ENV === "development" && !emailResult.success
          ? { devVerificationCode: verificationCode }
          : {}),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register route error:", error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}