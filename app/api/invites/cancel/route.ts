import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  request: Request
) {
  try {

    const session = await getServerSession(authOptions)

const user = session?.user as
  | {
      organisationId?: string
      role?: string
    }
  | undefined

const organisationId = user?.organisationId
const role = user?.role

if (!organisationId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

if (
  role !== "admin" &&
  role !== "manager"
) {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  )
}

const { inviteId } =
await request.json()

    if (!inviteId) {
      return NextResponse.json(
        {
          error: "Invite ID required",
        },
        {
          status: 400,
        }
      )
    }

    const invite = await sanityClient.fetch(
  `*[
      _type=="invite" &&
      _id==$inviteId &&
      organisation._ref==$organisationId
    ][0]{
      _id
    }`,
  {
    inviteId,
    organisationId,
  }
)

if (!invite) {
  return NextResponse.json(
    { error: "Invite not found" },
    { status: 404 }
  )
}

await sanityClient
.patch(inviteId)
      .set({
        status: "revoked",
      })
      .commit()

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to cancel invite",
      },
      {
        status: 500,
      }
    )
  }
}