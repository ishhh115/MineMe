import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"

export async function POST(request: Request) {
  try {
    const {
  identifier,
  code,
  password,
} = await request.json()

    if (
  !identifier ||
  !code ||
  !password
) {
      return NextResponse.json({ message: "Email, OTP, and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    const user = await sanityClient.fetch(
  `*[
    _type == "user" &&
    (
      email == $identifier ||
      phone == $identifier
    )
  ][0]{
    _id,
    resetPasswordCodeHash,
    resetPasswordCodeExpiresAt,
    isVerified
  }`,
  { identifier }
)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (!user.resetPasswordCodeHash || !user.resetPasswordCodeExpiresAt) {
      return NextResponse.json({ message: "Reset code is missing. Please request a new one." }, { status: 400 })
    }

    if (new Date(user.resetPasswordCodeExpiresAt).getTime() < Date.now()) {
      return NextResponse.json({ message: "Reset code has expired. Please request a new one." }, { status: 400 })
    }

    const isValid = await bcrypt.compare(code, user.resetPasswordCodeHash)

    if (!isValid) {
      return NextResponse.json({ message: "Invalid reset code" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await sanityClient
      .patch(user._id)
      .set({
        password: hashedPassword,
        isVerified: true,
      })
      .unset(["resetPasswordCodeHash", "resetPasswordCodeExpiresAt"])
      .commit()

    return NextResponse.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("reset-password error", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}