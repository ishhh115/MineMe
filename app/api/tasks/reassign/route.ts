import { NextResponse } from 'next/server'
import { reassignTask } from '@/lib/queries'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { taskId, assignee } = await req.json()
    if (!taskId || !assignee) return NextResponse.json({ error: 'taskId and assignee required' }, { status: 400 })

      const session = await getServerSession(authOptions)

const orgId =
(session?.user as {
organisationId?: string
})?.organisationId

if (!orgId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

    const result =
await reassignTask(
taskId,
assignee,
orgId
)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('reassign error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
