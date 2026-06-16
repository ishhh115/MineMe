import { notFound } from "next/navigation"
import { getGroupDetailData } from "./data"
import { GroupDetailClient } from "./groupdetails"

type TabId = "overview" | "tasks" | "messages" | "members" | "settings"

type PageProps = {
  params: Promise<{ groupSlug: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function GroupDetailPage({ params, searchParams }: PageProps) {
  const { groupSlug } = await params
  const { tab } = await searchParams

  const validTabs: TabId[] = ["overview", "tasks", "messages", "members", "settings"]
  const activeTab: TabId = validTabs.includes(tab as TabId) ? (tab as TabId) : "overview"

  const { group, tasks, notifications, messages } = await getGroupDetailData(groupSlug)

  if (!group) notFound()

  return (
    <GroupDetailClient
      group={group}
      tasks={tasks}
      notifications={notifications}
      messages={messages}
      activeTab={activeTab}
    />
  )
}