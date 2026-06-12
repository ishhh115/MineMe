import { getServerSession } from "next-auth"
import {
  getDashboardStats,
  getRecentActivity,
  getUpcomingDeadlines,
  getGroupConversion,
  getTaskThroughput,
} from "@/lib/queries"
import { authOptions } from "@/lib/auth"
import { sanityClient } from "@/lib/sanity"


export async function getDashboardData() {
  try {
    // Get the logged in user's session
    const session = await getServerSession(authOptions)

    // Get org ID from session
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId

    const orgs = await sanityClient.fetch(` 
*[_type == "organisation"]{
  _id,
  name
}
`)

console.log("ALL ORGS:", orgs)

const users = await sanityClient.fetch(`
*[_type == "user"]{
  name,
  email,
  phone,
  role,
  "orgId": organisation._ref
}
`)

console.log("ALL USERS:", users)

    console.log("SESSION ORG:", orgId)

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

   const [
  stats,
  recentActivity,
  upcomingDeadlines,
  groupConversion,
  throughput
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
    }
  }
}