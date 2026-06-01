import { getServerSession } from "next-auth"
import { getDashboardStats, getRecentActivity, getUpcomingDeadlines, getGroupConversion } from "@/lib/queries"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function getDashboardData() {
  try {
    // Get the logged in user's session
    const session = await getServerSession(authOptions)

    // Get org ID from session
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      return {
        stats: {
          totalTasks: 0,
          pendingTasks: 0,
          urgentTasks: 0,
          completedViaWhatsapp: 0,
          awaitingResponse: 0,
          deliveryFailures: 0,
          totalGroups: 0,
          responseRate: 0,
          totalRemindersDelivered: 0,
        },
        recentActivity: [],
        upcomingDeadlines: [],
        groupConversion: [],
      }
    }

    const [stats, recentActivity, upcomingDeadlines, groupConversion] = await Promise.all([
      getDashboardStats(orgId),
      getRecentActivity(orgId),
      getUpcomingDeadlines(orgId),
      getGroupConversion(orgId),
    ])

    return {
      stats,
      recentActivity,
      upcomingDeadlines,
      groupConversion,
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return {
      stats: {
        totalTasks: 0,
        pendingTasks: 0,
        urgentTasks: 0,
        completedViaWhatsapp: 0,
        awaitingResponse: 0,
        deliveryFailures: 0,
        totalGroups: 0,
        responseRate: 0,
        totalRemindersDelivered: 0,
      },
      recentActivity: [],
      upcomingDeadlines: [],
      groupConversion: [],
    }
  }
}