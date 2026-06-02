import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getUsers } from '@/lib/queries'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || undefined
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const users = await getUsers(orgId, q ?? undefined)
    return NextResponse.json(users)
  } catch (err) {
    console.error('users list error', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
