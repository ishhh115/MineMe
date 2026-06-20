import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActivity } from "@/lib/queries"

export async function getActivityPageData() {
  const session = await getServerSession(authOptions)

  const orgId = (
    session?.user as {
      organisationId?: string
    }
  )?.organisationId

  if (!orgId) {
    return {
      activities: [],
    }
  }

  const activities =
    await getActivity(orgId)

  return {
    activities,
  }
}