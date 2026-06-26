import { NextResponse } from 'next/server'
import { deleteTask } from '@/lib/queries'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json()
    if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

      const session = await getServerSession(authOptions)

const user = session?.user as
  | {
      organisationId?: string
      role?: string
    }
  | undefined

const organisationId = user?.organisationId

if (!organisationId) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

    const result = await deleteTask(
  taskId,
  organisationId
)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('delete task error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
