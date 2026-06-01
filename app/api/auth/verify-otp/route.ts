import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 })
    }

    const user = await sanityClient.fetch(
      `*[_type == "user" && email == $email][0]{ _id, verificationCodeHash, verificationCodeExpiresAt, isVerified }`,
      { email }
    )

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account is already verified" })
    }

    if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
      return NextResponse.json({ message: "Verification code is missing. Please sign up again." }, { status: 400 })
    }

    if (new Date(user.verificationCodeExpiresAt).getTime() < Date.now()) {
      return NextResponse.json({ message: "Verification code has expired. Please sign up again." }, { status: 400 })
    }

    const isValid = await bcrypt.compare(code, user.verificationCodeHash)

    if (!isValid) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 })
    }

    await sanityClient.patch(user._id).set({ isVerified: true }).unset(["verificationCodeHash", "verificationCodeExpiresAt"]).commit()

    return NextResponse.json({ message: "Verification successful" })
  } catch (error) {
    console.error("verify-otp error", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}