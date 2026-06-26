import { NextResponse } from 'next/server'
import { snoozeTask } from '@/lib/queries'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"


export async function POST(req: Request) {
  try {

    const session = await getServerSession(authOptions)

const organisationId = (
  session?.user as {
    organisationId?: string
  } | undefined
)?.organisationId

if (!organisationId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
    const { taskId, snoozeUntil } = await req.json()
    if (!taskId || !snoozeUntil) {
      return NextResponse.json({ error: 'taskId and snoozeUntil required' }, { status: 400 })
    }

    const result = await snoozeTask(
  taskId,
  snoozeUntil,
  organisationId
)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('snooze error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
