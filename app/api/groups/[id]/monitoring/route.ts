import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const body = await request.json()

    await sanityClient
      .patch(id)
      .set({
        isMonitoring: body.isMonitoring,
      })
      .commit()

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to update monitoring" },
      { status: 500 }
    )
  }
}