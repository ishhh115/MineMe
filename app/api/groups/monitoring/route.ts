import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(req: Request) {
  try {
    const { groupId, isMonitoring } =
      await req.json()

    await sanityClient
      .patch(groupId)
      .set({
        isMonitoring,
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
          "Failed to update monitoring",
      },
      {
        status: 500,
      }
    )
  }
}