import { NextRequest, NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId")

  if (!taskId) {
    return NextResponse.json([], { status: 400 })
  }

  const task = await sanityClient.fetch(
    `*[_type=="task" && _id==$taskId][0]{
      group->{
        members
      }
    }`,
    { taskId }
  )

  return NextResponse.json(task?.group?.members || [])
}