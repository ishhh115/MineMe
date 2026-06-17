import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await sanityClient.delete(id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    )
  }
}