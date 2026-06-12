import { NextResponse } from 'next/server'
import { updateTaskStatus } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId, status, snoozeUntil } = await req.json()

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
  snoozeUntil
)

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('update-status error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}