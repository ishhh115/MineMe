import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function PATCH(req: Request) {
  try {
    const { groupId, phone } =
      await req.json()

    const group = await sanityClient.fetch(
      `*[_type=="group" && _id==$groupId][0]`,
      { groupId }
    )

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      )
    }

    const updatedMembers =
      (group.members || []).map(
        (member: any) =>
          member.phone === phone
            ? {
                ...member,
                linkedUserId: null,
                portalRole: null,
              }
            : member
      )

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
        error: "Failed to remove access",
      },
      {
        status: 500,
      }
    )
  }
}