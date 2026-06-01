import { NextResponse } from 'next/server'
import { deleteTask } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json()
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

    const result = await deleteTask(taskId)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('delete task error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
