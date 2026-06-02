import { getServerSession } from "next-auth"
import { getTasks } from "@/lib/queries"
import { authOptions } from "@/lib/auth"

export async function getTasksPageData() {
  const session = await getServerSession(authOptions)
  const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

  if (!orgId) {
    return { tasks: [] }
  }

  try {
    const tasks = await getTasks(orgId)
    return { tasks }
  } catch (error) {
    console.error("Tasks page data fetch error:", error)
    return { tasks: [] }
  }
}
