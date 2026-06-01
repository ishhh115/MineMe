import GroupsClient from "./groups-client"
import { getGroupsPageData } from "./data"

export default async function GroupsPage() {
  const { groups } = await getGroupsPageData()
  return <GroupsClient groups={groups} />
}
