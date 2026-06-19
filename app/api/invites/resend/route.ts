import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(
  request: Request
) {
  try {

    const { inviteId } =
      await request.json()

    await sanityClient
      .patch(inviteId)
      .set({
        status: "pending",
        sentAt:
          new Date().toISOString(),
      })
      .commit()

    return NextResponse.json({
      success: true,
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to resend invite",
      },
      {
        status: 500,
      }
    )
  }
}