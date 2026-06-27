"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  SearchIcon,
  UsersIcon,
  PlusIcon,
  EyeIcon,
  MoreHorizontalIcon,
  CheckSquareIcon,
  ClockIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { group } from "@/sanity/schemas/group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Group = {
  _id: string
  name?: string
  chatId?: string
  isMonitoring?: boolean
  messagesCount?: number
  tasksExtracted?: number
  lastMessageAt?: string
  pendingCount?: number
  completedCount?: number
  snoozedCount?: number
  totalTasks?: number
  participants?: number
  overdueCount?: number
  [key: string]: unknown
}

function getHealthStyle(health?: string) {
  switch ((health || "").toLowerCase()) {
    case "healthy":
    case "high activity":
      return {
        dot: "bg-emerald-400",
        badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        label: "Healthy",
      }
    case "attention":
    case "deadline risk":
    case "reminder heavy":
      return {
        dot: "bg-amber-400",
        badge: "border-amber-400/30 bg-amber-500/10 text-amber-300",
        label: "Attention",
      }
    case "critical":
      return {
        dot: "bg-red-400",
        badge: "border-red-400/30 bg-red-500/10 text-red-300",
        label: "Critical",
      }
    case "quiet":
    case "monitoring":
      return {
        dot: "bg-slate-400",
        badge: "border-slate-400/30 bg-slate-500/10 text-slate-300",
        label: "Quiet",
      }
    default:
      return {
        dot: "bg-slate-400",
        badge: "border-slate-400/30 bg-slate-500/10 text-slate-300",
        label: health || "—",
      }
  }
}

function deriveHealth({
  total,
  pending,
  completed,
  snoozed,
  overdue,
}: { total: number; pending: number; completed: number; snoozed: number; overdue: number }) {
  if (total === 0) return "Quiet"
  if (overdue > 0) return "Critical"

  const completionRate = completed / total
  const pendingRatio = pending / total
  const snoozedRatio = snoozed / total
  
  if (snoozedRatio > 0.4) return "Critical"
  if (completionRate < 0.3 || pendingRatio > 0.7) return "Critical"
  if (completionRate < 0.6 || pendingRatio > 0.4 || snoozedRatio > 0.2) return "Attention"
  return "Healthy"
}

function CompletionBar({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-emerald-400"
      : value >= 70
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-amber-400"
      : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-300">{value}%</span>
    </div>
  )
}

function formatLastActivity(dateString?: string) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const HEALTH_FILTERS = ["All", "Healthy", "Attention", "Critical"] as const

export default function GroupsClient({ groups }: { groups: Group[] }) {
  const [search, setSearch] = React.useState("")
  const [healthFilter, setHealthFilter] = React.useState<string>("All")

  const [showImportModal, setShowImportModal] = React.useState(false)
  const [whatsappGroups, setWhatsappGroups] = React.useState<any[]>([])
  const [loadingGroups, setLoadingGroups] = React.useState(false)
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([])
  const router = useRouter()

  const stats = React.useMemo(() => {
    const totalGroups = groups.length
    const totalTasks = groups.reduce((s, g) => s + (g.totalTasks ?? g.tasksExtracted ?? 0), 0)
    const pendingTasks = groups.reduce((s, g) => s + (g.pendingCount ?? 0), 0)
    const completedTasks = groups.reduce((s, g) => s + (g.completedCount ?? 0), 0)
    return { totalGroups, totalTasks, pendingTasks, completedTasks }
  }, [groups])  


async function loadWhatsappGroups() {
  try {
    setLoadingGroups(true)

    const res = await fetch("/api/groups/whatsapp")
    const data = await res.json()



    setWhatsappGroups(data.groups || [])
    setShowImportModal(true)
  } catch (error) {
    console.error(error)
  } finally {
    setLoadingGroups(false)
  }
}

async function importSelectedGroups() {
  try {
    const groupToImport = whatsappGroups.find((group) =>
      selectedGroups.includes(group.id)
    )

    const res = await fetch("/api/groups/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        group: groupToImport,
      }),
    })

    const data = await res.json()



    window.location.reload()
  } catch (error) {
    console.error(error)
  }
}

async function toggleMonitoring(
  groupId: string,
  currentState: boolean
) {
  try {
    const response = await fetch(
      `/api/groups/${groupId}/monitoring`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isMonitoring: !currentState,
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed")
    }

    toast.success(
      currentState
        ? "Monitoring paused"
        : "Monitoring resumed"
    )

    router.refresh()
  } catch (error) {
    console.error(error)

    toast.error("Failed to update monitoring")
  }
}

async function deleteGroup(groupId: string) {
  try {
    const response = await fetch(
      `/api/groups/${groupId}`,
      {
        method: "DELETE",
      }
    )

    if (!response.ok) {
      throw new Error("Delete failed")
    }

    toast.success("Group deleted successfully")

    router.refresh()
  } catch (error) {
    console.error(error)

    toast.error("Failed to delete group")
  }
}

const filteredGroups = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (groups || []).filter((g) => {
      const matchesSearch =
        !q ||
        (g.name || "").toLowerCase().includes(q)

      if (healthFilter === "All") return matchesSearch

      const total = g.totalTasks ?? g.tasksExtracted ?? 0
      const pending = g.pendingCount ?? 0
      const completed = g.completedCount ?? 0
      const snoozed = g.snoozedCount ?? 0
      const overdue = g.overdueCount ?? 0
      const hs = getHealthStyle(deriveHealth({ total, pending, completed, snoozed, overdue }))

      return matchesSearch && hs.label.toLowerCase() === healthFilter.toLowerCase()
    })
  }, [groups, healthFilter, search])



  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-start gap-3">
          <SidebarTrigger className="mt-0.5 md:hidden" />
          <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 p-3">
            <UsersIcon className="size-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              WhatsApp Operations Monitoring
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Groups</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor WhatsApp groups and task activity in real-time
            </p>
          </div>
        </div>
        <Button
  onClick={loadWhatsappGroups}
  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
>
  <PlusIcon className="mr-2 size-4" />
  {loadingGroups ? "Loading..." : "Add Group"}
</Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-300/10 bg-slate-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <UsersIcon className="size-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400">Total Groups</p>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{stats.totalGroups}</p>
            <p className="mt-1 text-xs text-emerald-400">↑ 2 this week</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-300/10 bg-slate-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <CheckSquareIcon className="size-4 text-blue-400" />
              </div>
              <p className="text-xs text-slate-400">Total Tasks</p>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{stats.totalTasks}</p>
            <p className="mt-1 text-xs text-blue-400">↑ 18 this week</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-300/10 bg-slate-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <ClockIcon className="size-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400">Pending Tasks</p>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{stats.pendingTasks}</p>
            <p className="mt-1 text-xs text-amber-400">↓ 5 this month</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-300/10 bg-slate-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CheckCircle2Icon className="size-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400">Completed Tasks</p>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{stats.completedTasks}</p>
            <p className="mt-1 text-xs text-emerald-400">↑ 22 this month</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="h-10 border-slate-300/15 bg-slate-900/35 pl-9 text-sm text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          {HEALTH_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setHealthFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                healthFilter === f
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-slate-700 bg-slate-900/30 text-slate-400 hover:text-slate-200"
              )}
            >
              {f === "All" ? "All" : `#${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="border border-slate-300/10 bg-slate-950/35">
        <CardHeader className="border-b border-slate-300/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">
              {filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-300/10 hover:bg-transparent">
                <TableHead className="pl-6 text-[11px] uppercase tracking-[0.18em] text-slate-400">Group Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Members</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total Tasks</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pending</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Completed</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Completion Rate</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Last Activity</TableHead>
                <TableHead className="pr-6 text-[11px] uppercase tracking-[0.18em] text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const total = group.totalTasks ?? group.tasksExtracted ?? 0
                  const pending = group.pendingCount ?? 0
                  const completed = group.completedCount ?? 0
                  const snoozed = group.snoozedCount ?? 0
                  const overdue = group.overdueCount ?? 0
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
                  const hs = getHealthStyle(deriveHealth({ total, pending, completed, snoozed, overdue }))

                  return (
                    <TableRow
                      key={group._id}
                      className="cursor-pointer border-slate-300/10 hover:bg-slate-900/40"
                    >
                      {/* Group Name */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-slate-200">
                            {(group.name || "G").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{group.name || "—"}</span>
                        </div>
                      </TableCell>

                      {/* Members */}
                      <TableCell className="py-4">
                        <span className="text-sm text-slate-200">
                          {group.participants ?? "—"}
                        </span>
                      </TableCell>

                      {/* Total Tasks */}
                      <TableCell className="py-4">
                        <span className="text-sm font-semibold text-white">{total}</span>
                      </TableCell>

                      {/* Pending */}
                      <TableCell className="py-4">
                        <span className={cn("text-sm font-semibold", pending > 0 ? "text-amber-300" : "text-slate-300")}>
                          {pending}
                        </span>
                      </TableCell>

                      {/* Completed */}
                      <TableCell className="py-4">
                        <span className="text-sm font-semibold text-emerald-300">{completed}</span>
                      </TableCell>

                      {/* Completion Rate */}
                      <TableCell className="py-4">
                        <CompletionBar value={rate} />
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full shrink-0", hs.dot)} />
                          <Badge variant="outline" className={cn("text-[11px]", hs.badge)}>
                            {hs.label}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Last Activity */}
                      <TableCell className="py-4">
                        <span className="text-sm text-slate-400">
                          {formatLastActivity(group.lastMessageAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/groups/${group._id}`}>
                            <Button size="sm" variant="ghost" className="size-8 p-0 text-slate-400 hover:text-white">
                              <EyeIcon className="size-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      size="sm"
      variant="ghost"
      className="size-8 p-0 text-slate-400 hover:text-white"
    >
      <MoreHorizontalIcon className="size-4" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="bg-slate-900 border-slate-700 text-white"
  >
    <DropdownMenuItem asChild>
      <Link href={`/groups/${group._id}`}>
        View Details
      </Link>
    </DropdownMenuItem>


    <DropdownMenuItem
  onClick={() =>
    toggleMonitoring(
      group._id,
      Boolean(group.isMonitoring)
    )
  }
>
      {group.isMonitoring
  ? "Pause Monitoring"
  : "Resume Monitoring"}
    </DropdownMenuItem>

    <DropdownMenuItem
      className="text-red-400"
      onClick={() => deleteGroup(group._id)}
    >
      Delete Group
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
  <TableCell colSpan={9} className="py-16">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-800">
        <UsersIcon className="size-5 text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">No groups connected yet</p>
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          Add the MindMe bot to your WhatsApp group, then import it here to start monitoring.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-left w-64">
        {["Add the MindMe bot number to your WhatsApp group", "Click \"Add Group\" above", "Select your group and click Import"].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
              {i + 1}
            </span>
            <p className="text-xs text-slate-400">{step}</p>
          </div>
        ))}
      </div>
    </div>
  </TableCell>
</TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Pagination stub ── */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing 1 to {filteredGroups.length} of {filteredGroups.length} groups
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-slate-700 text-slate-400" disabled>
            1
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" disabled>
            2
          </Button>
        </div>
      </div>
      {showImportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6">
      <h2 className="mb-4 text-lg font-bold text-white">
        Import WhatsApp Groups
      </h2>

      <div className="space-y-3">
        {whatsappGroups.map((group) => (
          <label
            key={group.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 p-3"
          >
            <div>
              <p className="font-medium text-white">
                {group.name}
              </p>

              <p className="text-xs text-slate-400">
                {group.participants_count || 0} members
              </p>
            </div>

            <input
              type="checkbox"
              checked={selectedGroups.includes(group.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGroups((prev) => [...prev, group.id])
                } else {
                  setSelectedGroups((prev) =>
                    prev.filter((id) => id !== group.id)
                  )
                }
              }}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setShowImportModal(false)}
        >
          Cancel
        </Button>

        <Button onClick={importSelectedGroups}>
  Import Selected
</Button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}