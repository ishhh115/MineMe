import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(
  request: Request
) {
  try {
    const { inviteId } =
      await request.json()

    if (!inviteId) {
      return NextResponse.json(
        {
          error: "Invite ID required",
        },
        {
          status: 400,
        }
      )
    }

    await sanityClient
      .patch(inviteId)
      .set({
        status: "revoked",
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
          "Failed to cancel invite",
      },
      {
        status: 500,
      }
    )
  }
}