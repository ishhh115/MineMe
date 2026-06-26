import { NextResponse } from 'next/server'
import { editTaskDeadline } from '@/lib/queries'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { taskId, newDeadline } = await req.json()
    if (!taskId || !newDeadline) return NextResponse.json({ error: 'taskId and newDeadline required' }, { status: 400 })

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

const result = await editTaskDeadline(
taskId,
newDeadline,
orgId
)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('edit-deadline error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
