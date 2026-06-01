import { NextResponse } from 'next/server'
import { editTaskDeadline } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId, newDeadline } = await req.json()
    if (!taskId || !newDeadline) return NextResponse.json({ error: 'taskId and newDeadline required' }, { status: 400 })

    const result = await editTaskDeadline(taskId, newDeadline)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('edit-deadline error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
