"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  EditIcon,
  MoreHorizontalIcon,
  UsersIcon,
  LayoutDashboardIcon,
  CheckSquareIcon,
  MessageCircleIcon,
  SettingsIcon,
  PlusIcon,
  DownloadIcon,
} from "lucide-react"


type Task = {
  _id: string
  taskText?: string
  assignedTo?: string
  deadline?: string
  urgency?: string
  status?: string
  source?: string
  originalMessage?: string
  createdAt?: string
}

type Notification = {
  _id: string
  channel?: string
  status?: string
  message?: string
  sentAt?: string
  createdAt?: string
  taskText?: string
  triggerReason?: string
}

type Message = {
  _id: string
  text?: string
  sender?: string
  timestamp?: string
  isTask?: boolean
}

type Group = {
  _id: string
  name?: string
  chatId?: string
  isMonitoring?: boolean
  messagesCount?: number
  tasksExtracted?: number
  lastMessageAt?: string
  createdAt?: string
  participants?: number
  description?: string
  pendingCount?: number
  completedCount?: number
  totalTasks?: number

  members?: Array<{
    name?: string
    phone?: string
    initials?: string
  }>
}

type User = {
  _id: string
  name?: string
  email?: string
  phone?: string
  role?: string
  isVerified?: boolean
  createdAt?: string
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { id: "tasks", label: "Tasks", icon: CheckSquareIcon },
  { id: "messages", label: "Messages", icon: MessageCircleIcon },
  { id: "members", label: "Members", icon: UsersIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const

type TabId = (typeof TABS)[number]["id"]

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function GroupDetailClient({
  group,
  tasks,
  notifications,
  messages,
  users,
  activeTab,
}: {
  group: Group
  tasks: Task[]
  notifications: Notification[]
  messages: Message[]
  users: User[]
  activeTab: TabId
}) {
  const router = useRouter()
  const total = group.totalTasks ?? 0
  const pending = group.pendingCount ?? 0
  const completed = group.completedCount ?? 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const health =
  completionRate < 30
    ? "Critical"
    : completionRate < 60
    ? "Attention"
    : "Healthy"

const healthClass =
  health === "Healthy"
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    : health === "Attention"
    ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
    : "border-red-400/30 bg-red-500/10 text-red-300"

  function navigateTab(tab: TabId) {
    router.push(`/groups/${group._id}?tab=${tab}`)
  }

  

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/groups" className="hover:text-white transition-colors">Groups</Link>
        <span>›</span>
        <span className="text-white">{group.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-slate-700 text-base font-bold text-white">
            {(group.name || "G").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
  <h1 className="text-2xl font-extrabold text-white">{group.name}</h1>

  <Badge
  variant="outline"
  className={`${healthClass} text-xs font-medium`}
>
  {health}
</Badge>
</div>
            <p className="mt-0.5 text-sm text-slate-400">
              {group.participants ?? "—"} WhatsApp Participants • Created on{" "}
              {group.createdAt
  ? new Date(group.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "tasks" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              <PlusIcon className="mr-1.5 size-4" /> Add Task
            </Button>
          )}
          {activeTab === "members" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
              <PlusIcon className="mr-1.5 size-4" /> Invite Member
            </Button>
          )}
          {(activeTab === "tasks" || activeTab === "messages") && (
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              <DownloadIcon className="mr-1.5 size-3.5" /> Export
            </Button>
          )}
         {/*} {activeTab === "overview" && (
            <>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                <EditIcon className="mr-1.5 size-3.5" /> Edit Group
              </Button>
              <Button variant="ghost" size="sm" className="size-9 p-0 text-slate-400">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </>
          )} */}

        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content rendered server-side via children pattern */}
      <GroupTabContent
        activeTab={activeTab}
        group={group}
        tasks={tasks}
        notifications={notifications}
        messages={messages}
        users={users}
        total={total}
        pending={pending}
        completed={completed}
        completionRate={completionRate}
      />
    </div>
  )
}

function GroupTabContent({
  activeTab, group, tasks, notifications, messages, users,
  total, pending, completed, completionRate,
}: {
  activeTab: TabId
  group: Group
  tasks: Task[]
  notifications: Notification[]
  messages: Message[]
  users: User[]
  total: number
  pending: number
  completed: number
  completionRate: number
}) {

  const OverviewTab = React.lazy(() => import("./tabs/overview-tab").then(m => ({ default: m.OverviewTab })))
  const TasksTab = React.lazy(() => import("./tabs/tasks-tab").then(m => ({ default: m.TasksTab })))
  const MessagesTab = React.lazy(() => import("./tabs/messages-tab").then(m => ({ default: m.MessagesTab })))
  const MembersTab = React.lazy(() => import("./tabs/members-tab").then(m => ({ default: m.MembersTab })))
  const SettingsTab = React.lazy(() => import("./tabs/settings-tab").then(m => ({ default: m.SettingsTab })))

  return (
    <React.Suspense fallback={<div className="py-12 text-center text-slate-400 text-sm">Loading...</div>}>
      {activeTab === "overview" && (
        <OverviewTab group={group} tasks={tasks} total={total} pending={pending} completed={completed} completionRate={completionRate} />
      )}
      {activeTab === "tasks" && <TasksTab tasks={tasks} />}
      {activeTab === "messages" && <MessagesTab messages={messages} messagesCount={group.messagesCount} />}
      {activeTab === "members" && (
  <MembersTab
  users={users}
  tasks={tasks}
  members={group.members || []}
  groupId={group._id}
/>
)}
      {activeTab === "settings" && <SettingsTab group={group} />}
    </React.Suspense>
  )
}