import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

if (role !== "admin" && role !== "manager") {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  )
}
    const { id } = await params
    const group = await sanityClient.fetch(
  `*[
      _type=="group" &&
      _id==$id &&
      organisation._ref==$orgId
   ][0]{_id}`,
  {
    id,
    orgId,
  }
)

if (!group) {
  return NextResponse.json(
    { error: "Group not found" },
    { status:404 }
  )
}

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