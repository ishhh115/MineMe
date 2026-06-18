import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    console.log("SESSION:", session)
console.log("SESSION USER:", session?.user)
console.log("ROLE:", (session?.user as any)?.role)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userRole = (session.user as any)?.role

    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete groups" },
        { status: 403 }
      )
    }


    const { groupId } = await req.json()

    const tasks = await sanityClient.fetch(
      `*[_type == "task" && group._ref == $groupId]._id`,
      { groupId }
    )

    const messages = await sanityClient.fetch(
      `*[_type == "message" && group._ref == $groupId]._id`,
      { groupId }
    )

    const notifications = await sanityClient.fetch(
      `*[_type == "notification" && task->group._ref == $groupId]._id`,
      { groupId }
    )

    const idsToDelete = [
      ...tasks,
      ...messages,
      ...notifications,
      groupId,
    ]

    if (idsToDelete.length > 0) {
      const transaction =
        sanityClient.transaction()

      idsToDelete.forEach((id: string) => {
        transaction.delete(id)
      })

      await transaction.commit()
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to delete group",
      },
      {
        status: 500,
      }
    )
  }
}