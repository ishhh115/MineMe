"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

type Task = {
  _id: string
  taskText?: string
  assignedTo?: string
  deadline?: string
  urgency?: string
  status?: string
  createdAt?: string
}

type Group = {
  _id: string
  name?: string
  chatId?: string
  createdAt?: string
  lastMessageAt?: string
  participants?: number
  description?: string
  messagesCount?: number
}

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

function SparklineChart({ tasks }: { tasks: Task[] }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const created = last7Days.map(
    (day) => tasks.filter((t) => t.createdAt && new Date(t.createdAt).toDateString() === day.toDateString()).length
  )
  const completedArr = last7Days.map(
    (day) => tasks.filter((t) => t.status === "completed" && t.createdAt && new Date(t.createdAt).toDateString() === day.toDateString()).length
  )

  const maxVal = Math.max(...created, ...completedArr, 1)
  const W = 500
  const H = 130
  const pad = 16

  function toPoints(data: number[]) {
    return data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (W - pad * 2)
      const y = H - pad - (v / maxVal) * (H - pad * 2)
      return `${x},${y}`
    }).join(" ")
  }

  const labels = last7Days.map(d => d.toLocaleDateString([], { month: "short", day: "numeric" }))

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={pad} y1={pad + t * (H - pad * 2)} x2={W - pad} y2={pad + t * (H - pad * 2)}
            stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
        ))}
        <polyline points={toPoints(created)} fill="none" stroke="rgba(139,92,246,0.9)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={toPoints(completedArr)} fill="none" stroke="rgba(52,211,153,0.9)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {labels.map((label, i) => (
          <text key={label} x={pad + (i / (labels.length - 1)) * (W - pad * 2)} y={H + 18}
            textAnchor="middle" fontSize="10" fill="rgba(148,163,184,0.5)">{label}</text>
        ))}
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-violet-400" />Created</div>
        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-400" />Completed</div>
      </div>
    </div>
  )
}

export function OverviewTab({ group, tasks, total, pending, completed, completionRate }: {
  group: Group
  tasks: Task[]
  total: number
  pending: number
  completed: number
  completionRate: number
}) {
  const contributors = React.useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {}
    tasks.forEach((t) => {
      if (t.assignedTo) {
        if (!map[t.assignedTo]) map[t.assignedTo] = { total: 0, completed: 0 }
        map[t.assignedTo].total++
        if (t.status === "completed") map[t.assignedTo].completed++
      }
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
  }, [tasks])

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Total Tasks", value: total, color: "text-white" },
          { label: "Pending Tasks", value: pending, color: "text-amber-300" },
          { label: "Completed Tasks", value: completed, color: "text-emerald-300" },
          { label: "Completion Rate", value: `${completionRate}%`, color: "text-white", bar: completionRate },
        ].map((stat) => (
          <Card key={stat.label} className="border border-slate-800 bg-slate-900/50">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-black ${stat.color}`}>{stat.value}</p>
              {stat.bar !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${stat.bar}%` }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Group Info */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Card className="border border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <p className="mb-4 text-sm font-semibold text-white">Task Activity (Last 7 Days)</p>
            <SparklineChart tasks={tasks} />
          </CardContent>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-semibold text-white">Group Info</p>
            <div className="space-y-2.5 text-sm divide-y divide-slate-800">
              {[
                { label: "Group ID", value: group.chatId || group._id, mono: true },
                { label: "WhatsApp ID", value: group.chatId || "—", mono: true },
                { label: "Created", value: group.createdAt ? new Date(group.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—" },
                { label: "Members", value: String(group.participants ?? "—") },
                { label: "Description", value: group.description || "Official test group for operations monitoring" },
                { label: "Last Activity", value: timeAgo(group.lastMessageAt) },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between pt-2.5 first:pt-0">
                  <span className="text-slate-400 shrink-0">{label}</span>
                  <span
  className={`text-slate-300 text-xs text-right max-w-[220px] break-all ${
    mono ? "font-mono" : ""
  }`}
>
  {value}
</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + Top Contributors */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Card className="border border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Recent Activity</p>
              <Link
  href={`/groups/${group._id}?tab=tasks`}
  className="text-xs text-emerald-400 hover:text-emerald-300"
>
  View all activity →
</Link>
            </div>
            <div className="space-y-4">
              {tasks.slice(0, 6).map((task) => (
                <div key={task._id} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    task.status === "completed" ? "bg-emerald-500/20 text-emerald-300" : "bg-violet-500/20 text-violet-300"
                  }`}>
                    {(task.assignedTo || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">
                      {task.status === "completed" ? "Task completed: " : "New task created: "}
                      <span className="font-medium">"{task.taskText}"</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">by {task.assignedTo || "Unknown"} • {timeAgo(task.createdAt)}</p>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-slate-400">No recent activity</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/50">
          <CardContent className="p-5">
            <p className="mb-4 text-sm font-semibold text-white">Top Contributors</p>
            <div className="space-y-4">
              {contributors.map(([name, data]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{name}</p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min((data.total / (contributors[0]?.[1]?.total || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{data.total} tasks</span>
                </div>
              ))}
              {contributors.length === 0 && <p className="text-sm text-slate-400">No contributors yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}