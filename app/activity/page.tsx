import ActivityClient from "./activity-client"
import { getActivityPageData } from "./data"

export default async function ActivityPage() {
  const { activities } =
    await getActivityPageData()

  return (
    <ActivityClient
      activities={activities}
    />
  )
}