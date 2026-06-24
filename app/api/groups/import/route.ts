import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { importWhatsappGroup } from "@/lib/queries"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

const organisationId =
  (session?.user as { organisationId?: string })?.organisationId

const adminPhone =
  (session?.user as { phone?: string })?.phone

    if (!organisationId) {
      return NextResponse.json(
        { error: "No organisation found" },
        { status: 401 }
      )
    }

    const { group } = await request.json()

console.log("GROUP RECEIVED:", group)
console.log("ORG ID:", organisationId)
console.log("ADMIN PHONE:", adminPhone)

    if (!group) {
      return NextResponse.json(
        { error: "Group required" },
        { status: 400 }
      )
    }

    const importedGroup = await importWhatsappGroup(
  group,
  organisationId,
  adminPhone
)

    return NextResponse.json({
      success: true,
      group: importedGroup,
    })
  } catch (error) {
    console.error("IMPORT GROUP ERROR:", error)

    return NextResponse.json(
      { error: "Failed to import group" },
      { status: 500 }
    )
  }
}