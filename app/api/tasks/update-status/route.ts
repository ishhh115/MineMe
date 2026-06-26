import { NextResponse } from 'next/server'
import { updateTaskStatus } from '@/lib/queries'

    import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { taskId, status, snoozeUntil } = await req.json()


const session = await getServerSession(authOptions)

const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

if (!orgId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

    console.log("API HIT")
    console.log("TASK:", taskId)
    console.log("STATUS:", status)

    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'taskId and status required' },
        { status: 400 }
      )
    }

    const result = await updateTaskStatus(
  taskId,
  status,
  orgId,
  snoozeUntil
)

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('update-status error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}