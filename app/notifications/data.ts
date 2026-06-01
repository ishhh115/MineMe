import { getServerSession } from "next-auth"
import { getNotifications } from "@/lib/queries"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getNotificationsPageData() {
  try {
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      throw new Error("No organisation ID found")
    }

    const notifications = await getNotifications(orgId)
    return { notifications }
  } catch (error) {
    console.error("Notifications page data fetch error:", error)
    return { notifications: [] }
  }
}