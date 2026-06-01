import { NextResponse } from 'next/server'
import { reassignTask } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId, assignee } = await req.json()
    if (!taskId || !assignee) return NextResponse.json({ error: 'taskId and assignee required' }, { status: 400 })

    const result = await reassignTask(taskId, assignee)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('reassign error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
