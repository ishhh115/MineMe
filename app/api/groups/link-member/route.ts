import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { updateUserRole } from "@/lib/queries"

export async function PATCH(req: Request) {
  try {
    const {
      groupId,
      phone,
      userId,
      role,
    } = await req.json()

    if (!groupId || !phone || !userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update the user's portal role
    await updateUserRole(userId, role)

    // Fetch the selected user
    const user = await sanityClient.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        name,
        email,
        phone
      }`,
      { userId }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Fetch the group
    const group = await sanityClient.fetch(
      `*[_type == "group" && _id == $groupId][0]`,
      { groupId }
    )

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      )
    }

    // Update the matching WhatsApp member
    const updatedMembers = (group.members || []).map((member: any) => {
      if (member.phone !== phone) return member

      return {
        ...member,
        name: user.name,
        linkedUserId: user._id,
        email: user.email,
        portalRole: role,
      }
    })

    await sanityClient
      .patch(groupId)
      .set({
        members: updatedMembers,
      })
      .commit()

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