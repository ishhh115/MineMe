export const dynamic = "force-dynamic"
import ActivityActions from "@/components/activity-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import LiveIndicator from "@/components/live-indicator"
import EmptyState from "@/components/empty-state"
import { getDashboardData } from "./data"
import {
  AlertCircleIcon,
  BellRingIcon,
  CheckSquareIcon,
  Clock3Icon,
  MessageCircleIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"


const urgencyConfig: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-200 border-rose-400/25",
  medium: "bg-amber-500/15 text-amber-200 border-amber-400/25",
  low: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
  High: "bg-rose-500/15 text-rose-200 border-rose-400/25",
  Medium: "bg-amber-500/15 text-amber-200 border-amber-400/25",
  Low: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
}

function capitalize(str: string) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDeadline(dateStr: string) {
  if (!dateStr) return "No deadline"
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const deadlineDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

  if (deadlineDate.getTime() === today.getTime()) return `Today · ${time}`
  if (deadlineDate.getTime() === tomorrow.getTime()) return `Tomorrow · ${time}`
  return `${date.toLocaleDateString("en-US", { weekday: "short" })} · ${time}`
}

export default async function DashboardPage() {

  const {
  stats,
  recentActivity,
  upcomingDeadlines,
  groupConversion,
  throughput: rawThroughput,
} = await getDashboardData()


const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const throughput = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (6 - i))

  const created = rawThroughput.filter((task: any) => {
    if (!task.createdAt) return false

    const taskDate = new Date(task.createdAt)

    return (
      taskDate.getFullYear() === date.getFullYear() &&
      taskDate.getMonth() === date.getMonth() &&
      taskDate.getDate() === date.getDate()
    )
  }).length

  const completed = rawThroughput.filter((task: any) => {
    if (!task.completedAt) return false

    const taskDate = new Date(task.completedAt)

    return (
      taskDate.getFullYear() === date.getFullYear() &&
      taskDate.getMonth() === date.getMonth() &&
      taskDate.getDate() === date.getDate()
    )
  }).length

  return {
    day: dayNames[date.getDay()],
    created,
    completed,
  }
})
  const statCards = [
    {
      title: "Response Rate",
      value: `${stats.responseRate ?? 79}%`,
      description: "WhatsApp response within SLA",
      icon: TrendingUpIcon,
      color: "text-emerald-300",
      trend: "+3% vs last week",
    },
    {
      title: "Awaiting Response",
      value: stats.awaitingResponse ?? 0,
      description: "Tasks awaiting reply on WhatsApp",
      icon: Clock3Icon,
      color: "text-amber-300",
      trend: `${stats.awaitingResponse ?? 0} pending`,
    },
    {
      title: "Delivery Failures",
      value: stats.deliveryFailures ?? 0,
      description: "Failed or bounced reminders",
      icon: AlertCircleIcon,
      color: "text-rose-300",
      trend: `${stats.deliveryFailures ?? 0} failed`,
    },
    {
      title: "Completed via WhatsApp",
      value: stats.completedViaWhatsapp ?? 0,
      description: "Tasks confirmed inside WhatsApp",
      icon: CheckSquareIcon,
      color: "text-sky-300",
      trend: `${stats.completedViaWhatsapp ?? 0} total`,
    },
  ]

  const maxYAxis = 24
  const chartHeight = 180
  const chartWidth = 560
  const xStep = chartWidth / (throughput.length - 1)

  const linePoints = throughput
    .map((point, index) => {
      const x = index * xStep
      const y = chartHeight - (point.completed / maxYAxis) * chartHeight
      return `${x},${y}`
    })
    .join(" ")

    const delivered = stats.totalRemindersDelivered ?? 0

const responded = stats.completedViaWhatsapp ?? 0

const noResponse = Math.max(delivered - responded, 0)

  return (
    <div className="dashboard-shell relative w-full overflow-hidden">
      <div className="dashboard-noise" />
      <div className="pointer-events-none absolute -top-36 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="glass-card-calm rounded-3xl border p-5 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/10 bg-slate-900/35 px-3 py-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex size-2.5 items-center justify-center">
                <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
              </span>
              <span className="font-medium text-slate-200">Live sync active</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">Updated recently</span>
            </div>
            <LiveIndicator start={32} />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <SidebarTrigger className="mt-0.5 md:hidden" />
              <div className="rounded-xl border border-slate-300/15 bg-slate-900/45 p-3">
                <MessageCircleIcon className="size-5 text-slate-200" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">MindMe Dashboard</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Operational Overview</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-200/90">Track tasks, deadlines, reminders, and conversion from chat to execution.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <article
                key={stat.title}
                className="rounded-2xl border border-slate-200/10 bg-slate-950/35 px-4 py-4 transition-transform duration-250 hover:-translate-y-1 hover:border-slate-200/20"
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{stat.title}</p>
                    <p className={`mt-2 text-4xl font-black leading-none tracking-tight ${stat.color}`}>{stat.value}</p>
                    <p className="mt-2 text-xs text-slate-200">{stat.description}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/12 bg-slate-900/45 p-2">
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/10 pt-3 text-xs text-slate-300">
                  <TrendingUpIcon className="size-3.5" />
                  {stat.trend}
                </div>
              </article>
            ))}
          </div>
        </header>

        <Card className="relative overflow-hidden rounded-3xl border border-emerald-300/30 lg:border-emerald-300/24 bg-gradient-to-br from-emerald-500/18 via-emerald-500/8 to-black/40 shadow-[0_25px_65px_rgba(67,45,215,0.22)]">
          <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-emerald-300/16 blur-3xl" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">Smart Summary Panel</p>
                <CardTitle className="mt-1 text-2xl font-extrabold text-white">Today at a Glance</CardTitle>
              </div>
              <Badge className="border border-emerald-300/35 bg-emerald-500/24 text-emerald-50">Live Sync</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="h-full min-h-32 rounded-2xl border border-slate-200/15 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-300">Tasks Extracted</p>
              <p className="mt-1 text-3xl font-black text-emerald-100">{stats.totalTasks ?? 0}</p>
              <p className="mt-1 text-xs text-slate-300">From connected WhatsApp groups this week</p>
            </div>
            <div className="h-full min-h-32 rounded-2xl border border-slate-200/15 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-300">WhatsApp Response Rate</p>
              <p className="mt-1 text-3xl font-black text-emerald-100">{stats.responseRate ?? 0}%</p>
              <p className="mt-1 text-xs text-slate-300">Percentage of reminders that received a reply</p>
            </div>
            <div className="h-full min-h-32 rounded-2xl border border-slate-200/15 bg-slate-950/30 p-4">
              <p className="text-xs text-slate-300">Escalations / Overdue</p>
              <p className="mt-1 text-3xl font-black text-emerald-100">{stats.urgentTasks ?? 0}</p>
              <p className="mt-1 text-xs text-slate-300">Requires operator attention</p>
            </div>
          </CardContent>
        </Card>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/14 to-transparent" />

        <section className="grid gap-4 xl:grid-cols-12">
          <Card className="glass-card-raised border xl:col-span-8">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-white">Task Throughput (Last 7 Days)</CardTitle>
                  <p className="text-xs text-slate-300">Completed vs created tasks by day — monitor execution velocity from WhatsApp</p>
                </div>
                <Badge variant="outline" className="border-slate-300/20 text-slate-200">Daily refresh</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/20 bg-slate-900/45 px-2 py-1 text-slate-300">
                  <span className="size-2 rounded-full bg-slate-400/90" />
                  Created
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/20 bg-slate-900/45 px-2 py-1 text-slate-300">
                  <span className="size-2 rounded-full bg-emerald-300/75" />
                  Completed
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-slate-200/12 bg-slate-950/35 p-4">
                <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${chartWidth + 70} ${chartHeight + 45}`} className="h-[260px] w-full min-w-0">
                    {[0, 6, 12, 18, 24].map((tick) => {
                      const y = chartHeight - (tick / maxYAxis) * chartHeight + 8
                      return (
                        <g key={tick}>
                          <line x1="46" y1={y} x2={chartWidth + 46} y2={y} stroke="rgba(255,255,255,0.11)" strokeDasharray="3 4" />
                          <text x="10" y={y + 3} className="fill-zinc-400 text-[11px]">{tick}</text>
                        </g>
                      )
                    })}
                    <g transform="translate(46,8)">
                      {throughput.map((point, index) => {
                        const x = index * xStep
                        const barHeight = (point.created / maxYAxis) * chartHeight
                        const y = chartHeight - barHeight
                        return (
                          <g key={point.day}>
                            <rect x={x - 16} y={y} width="26" height={barHeight} rx="4" fill="rgba(100,116,139,0.62)">
                              <title>{`${point.day}: ${point.created} tasks created`}</title>
                            </rect>
                            <text x={x - 4} y={chartHeight + 18} className="fill-zinc-300 text-[11px]">{point.day}</text>
                          </g>
                        )
                      })}
                      <polyline points={linePoints} fill="none" stroke="rgba(74,222,128,0.78)" strokeWidth="2.8" strokeLinecap="round" className="transition-all duration-500" />
                      {throughput.map((point, index) => {
                        const x = index * xStep
                        const y = chartHeight - (point.completed / maxYAxis) * chartHeight
                        return (
                          <circle key={`${point.day}-line`} cx={x} cy={y} r="4" fill="rgba(167,243,208,0.82)">
                            <title>{`${point.day}: ${point.completed} tasks completed`}</title>
                          </circle>
                        )
                      })}
                    </g>
                    <text x={chartWidth / 2 + 46} y={chartHeight + 38} className="fill-zinc-400 text-[11px]">Day of week</text>
                    <text transform={`translate(14 ${chartHeight / 2 + 8}) rotate(-90)`} className="fill-zinc-400 text-[11px]">Number of tasks</text>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-calm border xl:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Reminder Delivery & Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
  className="mx-auto h-36 w-36 rounded-full p-3"
  style={{
    background: `conic-gradient(
      ${
        stats.responseRate >= 80
          ? "rgba(34,197,94,0.78)"
          : stats.responseRate >= 50
          ? "rgba(250,204,21,0.78)"
          : "rgba(239,68,68,0.78)"
      } 0 ${stats.responseRate}%,
      rgba(148,163,184,0.2) ${stats.responseRate}% 100%
    )`,
  }}
>
                <div
  className={`flex h-full w-full items-center justify-center rounded-full bg-black/55 text-3xl font-black ${
    stats.responseRate >= 80
      ? "text-emerald-200"
      : stats.responseRate >= 50
      ? "text-yellow-200"
      : "text-red-200"
  }`}
>{stats.responseRate ?? 0}%</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
  <div>
    <div className="mb-1 flex items-center justify-center gap-2">
      <div className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="text-xs text-slate-300">
        Responded
      </span>
    </div>

    <p className="text-2xl font-bold text-emerald-200">
      {responded}
    </p>
  </div>

  <div>
    <div className="mb-1 flex items-center justify-center gap-2">
      <div className="h-2 w-2 rounded-full bg-slate-500" />
      <span className="text-xs text-slate-300">
        No Response
      </span>
    </div>

    <p className="text-2xl font-bold text-slate-200">
      {noResponse}
    </p>
  </div>
</div>
<div className="border-t border-slate-700 pt-4 text-center">
  <p className="text-sm text-slate-400">
    {delivered} reminders sent
  </p>
</div>
            </CardContent>
          </Card>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/12 to-transparent" />

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="glass-card-calm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white">Message-to-Task Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupConversion.length === 0 ? (
                <EmptyState title="No monitored groups yet" description="Add your first WhatsApp group to start tracking conversion." />
              ) : (
                groupConversion.map((group: any) => {
                  const conversion = group.messagesCount > 0
                    ? Math.round((group.tasksExtracted / group.messagesCount) * 100)
                    : 0
                  return (
                    <div key={group._id} className="rounded-xl border border-slate-200/10 bg-slate-950/35 p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-100">{group.name}</span>
                        <span className="text-slate-300">{conversion}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-300/75" style={{ width: `${conversion}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-300">{group.tasksExtracted ?? 0} tasks from {group.messagesCount ?? 0} messages</p>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card className="glass-card-raised border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-white">Upcoming Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingDeadlines.length === 0 ? (
                <EmptyState title="No upcoming deadlines" description="You're all caught up — no deadlines in the next 48 hours." />
              ) : (
                upcomingDeadlines.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/10 bg-slate-950/35 p-3 hover:bg-slate-900/40 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.taskText}</p>
                      <p className="text-xs text-slate-300">{item.groupName} · {formatDeadline(item.deadline)}</p>
                    </div>
                    <Badge variant="outline" className={urgencyConfig[item.urgency]}>{capitalize(item.urgency)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/10 to-transparent" />

        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Recent Operational Activity</CardTitle>
                <p className="text-xs text-slate-300">Latest operational events and task confirmations from WhatsApp</p>
              </div>
              <Badge variant="outline" className="border-slate-300/20 text-slate-200">Last 24 hours</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentActivity.length === 0 ? (
              <EmptyState title="No recent notifications" description="No activity in the last 24 hours." />
            ) : (
              recentActivity.map((item: any) => (
                <article
                  key={item._id}
                  className="group grid items-center gap-2 rounded-xl border border-slate-200/10 bg-slate-950/35 p-3 sm:grid-cols-[1fr_auto] hover:shadow-[0_8px_20px_rgba(2,6,23,0.6)] hover:bg-slate-900/40 transition-all cursor-pointer"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300/20 bg-slate-900/55 text-xs font-bold text-slate-100">
                      {(item.groupName || "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{item.taskText}</p>
                        <Badge variant="outline" className={urgencyConfig[item.urgency]}>{capitalize(item.urgency)}</Badge>
                        {item.status === "snoozed" && (
                        <Badge variant="outline"className="bg-amber-500/15 text-amber-200 border-amber-400/25">Snoozed</Badge>)}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-300">{item.groupName} · {timeAgo(item.createdAt)}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{item.originalMessage}</p>
                    </div>
                  </div>
                  <ActivityActions taskId={item._id} />
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <nav className="fixed inset-x-4 bottom-3 z-30 rounded-2xl border border-white/15 bg-black/70 p-2 backdrop-blur md:hidden">
          <ul className="grid grid-cols-3 gap-1 text-xs">
            {[
              { label: "Home", icon: CheckSquareIcon, active: true },
              { label: "Alerts", icon: BellRingIcon },
              { label: "Groups", icon: UsersIcon },
            ].map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`flex w-full flex-col items-center gap-1 rounded-xl py-2 transition-colors ${item.active ? "bg-emerald-500/25 text-emerald-100" : "text-zinc-300 hover:bg-white/10"}`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}