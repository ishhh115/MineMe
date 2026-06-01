import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function POST(request: Request) {
  try {
    const { phone, email } = await request.json()
    const identifier = (phone || email || "").trim()

    if (!identifier) {
      return NextResponse.json(
        { message: "Phone or email is required" },
        { status: 400 }
      )
    }

    const user = await sanityClient.fetch(
      `*[_type == "user" && (phone == $identifier || email == $identifier)][0]{ _id, isVerified }`,
      { identifier }
    )

    return NextResponse.json({ exists: Boolean(user?._id), verified: Boolean(user?.isVerified) })
  } catch (error) {
    console.error("check-user error", error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}
