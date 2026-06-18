import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(req: Request) {
  try {
    const {
      groupId,
      name,
      description,
    } = await req.json()

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID required" },
        { status: 400 }
      )
    }

    await sanityClient
      .patch(groupId)
      .set({
        name,
        description,
      })
      .commit()

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    )
  }
}