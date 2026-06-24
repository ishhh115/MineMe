import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserRole = (session?.user as { role?: string })?.role
    const orgId = (session?.user as { organisationId?: string })?.organisationId

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    if (currentUserRole !== "admin") {
      return NextResponse.json({ error: "Only admins can delete groups" }, { status: 403 })
    }

    const { id } = await params

    // Verify group belongs to this org before deleting
    const group = await sanityClient.fetch(
      `*[_type == "group" && _id == $id && organisation._ref == $orgId][0]{ _id }`,
      { id, orgId }
    )

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    await sanityClient.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
  }
}