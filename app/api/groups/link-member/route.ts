import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { updateUserRole } from "@/lib/queries"

export async function PATCH(req: Request) {
  try {
    const {
      userId,
      role,
    } = await req.json()

    await updateUserRole(
      userId,
      role
    )

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to link member",
      },
      {
        status: 500,
      }
    )
  }
}