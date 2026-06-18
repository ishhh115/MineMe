import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"
import { getUsers } from "@/lib/queries"

export async function PATCH(
  req: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      )

    const orgId = (
      session?.user as {
        organisationId?: string
      }
    )?.organisationId

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const users =
      await getUsers(orgId)

    const currentUser =
      users.find(
        (u) =>
          u.email ===
          session?.user?.email
      )

    if (
      currentUser?.role !==
        "admin" &&
      currentUser?.role !==
        "manager"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const {
      groupId,
      isMonitoring,
    } = await req.json()

    await sanityClient
      .patch(groupId)
      .set({
        isMonitoring,
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
          "Failed to update monitoring",
      },
      {
        status: 500,
      }
    )
  }
}