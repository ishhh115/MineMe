import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

const user = session?.user as
  | {
      organisationId?: string
      role?: string
    }
  | undefined

const orgId = user?.organisationId
const role = user?.role

if (!orgId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

if (role !== "admin") {
  return NextResponse.json(
    { error: "Only admins can remove access" },
    { status: 403 }
  )
}
    const { groupId, phone } =
      await req.json()

    const group = await sanityClient.fetch(
  `*[
      _type=="group" &&
      _id==$groupId &&
      organisation._ref==$orgId
   ][0]`,
  {
    groupId,
    orgId,
  }
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