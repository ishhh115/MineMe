import { getServerSession } from "next-auth"
import {
  getDashboardStats,
  getRecentActivity,
  getUpcomingDeadlines,
  getGroupConversion,
  getTaskThroughput,
} from "@/lib/queries"
import { authOptions } from "@/lib/auth"

export async function getDashboardData() {
  try {
    const session = await getServerSession(authOptions)
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
        throughput: [],
      }
    }

    const [
      stats,
      recentActivity,
      upcomingDeadlines,
      groupConversion,
      throughput,
    ] = await Promise.all([
      getDashboardStats(orgId),
      getRecentActivity(orgId),
      getUpcomingDeadlines(orgId),
      getGroupConversion(orgId),
      getTaskThroughput(orgId),
    ])

    return {
      stats,
      recentActivity,
      upcomingDeadlines,
      groupConversion,
      throughput,
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
      throughput: [],
    }
  }
}