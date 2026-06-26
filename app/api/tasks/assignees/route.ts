import { NextRequest, NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"



export async function GET(req: NextRequest) {

  const session = await getServerSession(authOptions)

const orgId = (
  session?.user as {
    organisationId?: string
  } | undefined
)?.organisationId

if (!orgId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
  const taskId = req.nextUrl.searchParams.get("taskId")

  if (!taskId) {
    return NextResponse.json([], { status: 400 })
  }

  const task = await sanityClient.fetch(
    `*[
  _type == "task" &&
  _id == $taskId &&
  organisation._ref == $orgId
][0]{
  group->{
    members
  }
}`,
    {
  taskId,
  orgId,
}
  )

  if (!task) {
  return NextResponse.json(
    { error: "Task not found" },
    { status: 404 }
  )
}

return NextResponse.json(task.group?.members || [])
}