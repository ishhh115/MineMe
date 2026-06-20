import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActivity } from "@/lib/queries"

export async function getActivityPageData() {
  try {
    const session = await getServerSession(authOptions)

    const orgId =
      (session?.user as {
        organisationId?: string
      })?.organisationId

    if (!orgId) {
      throw new Error("No organisation ID found")
    }

    const activities =
      await getActivity(orgId)

    return {
      activities,
    }
  } catch (error) {
    console.error(error)

    return {
      activities: [],
    }
  }
}