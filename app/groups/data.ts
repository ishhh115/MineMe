import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGroups } from "@/lib/queries"

export async function getGroupsPageData() {
  try {
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId
    if (!orgId) throw new Error("No organisation ID found")
    const groups = await getGroups(orgId)
    return { groups }
  } catch (error) {
    console.error("Groups page data fetch error:", error)
    return { groups: [] }
  }
}