import { NextResponse } from 'next/server'
import { resendReminder } from '@/lib/queries'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json()
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

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
await resendReminder(
taskId,
orgId
)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('resend error', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'internal' }, { status: 500 })
  }
}
