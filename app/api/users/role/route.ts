import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"
import { updateUserRole } from "@/lib/queries"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const organisationId = (session?.user as { organisationId?: string })?.organisationId
    const currentUserRole = (session?.user as { role?: string })?.role

    if (!organisationId) {
      return NextResponse.json({ error: "No organisation found" }, { status: 401 })
    }

    // Only admins can change roles
    if (currentUserRole !== "admin") {
      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 })
    }

    const validRoles = ["admin", "manager", "member", "guest"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const targetUser = await sanityClient.fetch(
      `*[_type == "user" && _id == $userId][0]{ _id, "orgId": organisation._ref }`,
      { userId }
    )

    if (!targetUser || targetUser.orgId !== organisationId) {
      return NextResponse.json({ error: "User not found in your organisation" }, { status: 403 })
    }

    const result = await updateUserRole(userId, role)
    return NextResponse.json({ success: true, user: result })
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}