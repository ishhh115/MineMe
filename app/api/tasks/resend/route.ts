import { NextResponse } from 'next/server'
import { resendReminder } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json()
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

    const result = await resendReminder(taskId)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('resend error', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'internal' }, { status: 500 })
  }
}
