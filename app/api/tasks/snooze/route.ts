import { NextResponse } from 'next/server'
import { snoozeTask } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId, snoozeUntil } = await req.json()
    if (!taskId || !snoozeUntil) {
      return NextResponse.json({ error: 'taskId and snoozeUntil required' }, { status: 400 })
    }

    const result = await snoozeTask(taskId, snoozeUntil)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('snooze error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
