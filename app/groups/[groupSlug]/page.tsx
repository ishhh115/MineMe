import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { groupSummaries, getGroupBySlug } from "@/lib/group-data"
import {
  ArrowLeftIcon,
  BellRingIcon,
  CheckCircle2Icon,
  Clock3Icon,
  PauseCircleIcon,
  SparklesIcon,
  WifiIcon,
} from "lucide-react"

export function generateStaticParams() {
  return groupSummaries.map((group) => ({ groupSlug: group.slug }))
}

function MiniBars({ values, color = "rgba(74,222,128,0.8)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values)
  return (
    <div className="flex h-20 items-end gap-1 rounded-2xl border border-slate-300/10 bg-slate-950/35 p-3">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-sm"
          style={{ height: `${(value / max) * 100}%`, backgroundColor: color }}
          title={`${value}`}
        />
      ))}
    </div>
  )
}

export default function GroupDetailPage({ params }: { params: { groupSlug: string } }) {
  const group = getGroupBySlug(params.groupSlug)

  if (!group) {
    notFound()
  }

  const extractedCount = group.extractedTasks.length
  const extractionRate = Math.round((extractedCount / group.messagesToday) * 100)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-300/10 pb-6">
        <Link href="/groups" className="inline-flex w-fit items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
          <ArrowLeftIcon className="size-4" />
          Back to groups
        </Link>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <Card className="glass-card-raised border border-emerald-300/20">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-slate-300/10 bg-slate-900/35 text-slate-200">
                  {group.category}
                </Badge>
                <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-100">
                  {group.health}
                </Badge>
                <Badge variant="outline" className="border-slate-300/10 bg-slate-900/35 text-slate-300">
                  {group.syncLabel}
                </Badge>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-3xl font-extrabold text-white">{group.name}</CardTitle>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Operational view for recent messages, extracted tasks, reminders, deadlines, and timeline activity.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-300/10 bg-slate-950/35 p-3 text-right">
                  <p className="text-xs text-slate-400">Webhook active</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-100">Synced {group.lastSync}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Messages today</p>
                  <p className="mt-2 text-3xl font-black text-white">{group.messagesToday}</p>
                </div>
                <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Extraction rate</p>
                  <p className="mt-2 text-3xl font-black text-white">{extractionRate}%</p>
                </div>
                <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pending</p>
                  <p className="mt-2 text-3xl font-black text-amber-100">{group.pendingTasks}</p>
                </div>
                <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Deadline load</p>
                  <p className="mt-2 text-3xl font-black text-white">{group.deadlineLoad}%</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <CheckCircle2Icon className="size-4" />
                  View tasks
                </Button>
                <Button variant="outline" className="border-slate-300/15 bg-slate-900/35 text-slate-100 hover:bg-slate-800/55">
                  <BellRingIcon className="size-4" />
                  Send reminder
                </Button>
                <Button variant="outline" className="border-slate-300/15 bg-slate-900/35 text-slate-100 hover:bg-slate-800/55">
                  <PauseCircleIcon className="size-4" />
                  Pause monitoring
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-calm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Operational Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Reminder success</span>
                  <span>{group.reminderSuccess}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${group.reminderSuccess}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Completion</span>
                  <span>{group.completionRate}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
                  <div className="h-full rounded-full bg-slate-100/85" style={{ width: `${group.completionRate}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Overdue tasks</span>
                  <span>{group.overdueTasks}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <Clock3Icon className="size-4 text-rose-300" />
                  {group.deadlineLoad > 70 ? "Deadline heavy" : "Stable monitoring"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card-calm border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Group Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniBars values={group.analytics.messageVolume} color="rgba(100,116,139,0.8)" />
            <MiniBars values={group.analytics.extractionTrend} color="rgba(74,222,128,0.8)" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">Messages trend</p>
                <p className="mt-2 text-xl font-bold text-white">Steady activity</p>
              </div>
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">Extraction rate</p>
                <p className="mt-2 text-xl font-bold text-white">{group.extractionRate}%</p>
              </div>
              <div className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <p className="text-xs text-slate-400">Monitor state</p>
                <p className="mt-2 text-xl font-bold text-white">{group.health}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Group Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <div key={member} className="flex items-center gap-2 rounded-full border border-slate-300/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-100">
                  <div className="flex size-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold">
                    {member}
                  </div>
                  {member}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Activity level</span>
                <span>{group.messagesToday} messages</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
                <WifiIcon className="size-4 text-emerald-300" />
                {group.webhookActive ? "Webhook active" : "Webhook paused"}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Recent Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.recentMessages.map((message) => (
              <div key={`${message.time}-${message.author}`} className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{message.author}</span>
                  <span>{message.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-100">{message.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Extracted Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.extractedTasks.map((task) => (
              <div key={task.title} className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-400">Assigned to {task.owner}</p>
                  </div>
                  <Badge variant="outline" className={task.status === "Completed" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-slate-300/10 bg-slate-900/35 text-slate-200"}>
                    {task.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{task.deadline}</span>
                  <span className="inline-flex items-center gap-1">
                    <SparklesIcon className="size-3.5" />
                    View context in task workspace
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.deadlines.map((deadline) => (
              <div key={deadline.title} className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{deadline.title}</p>
                  <Badge variant="outline" className={deadline.priority === "High" ? "border-rose-400/20 bg-rose-500/10 text-rose-100" : deadline.priority === "Medium" ? "border-amber-400/20 bg-amber-500/10 text-amber-100" : "border-slate-300/10 bg-slate-900/35 text-slate-200"}>
                    {deadline.priority}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{deadline.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Reminder History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.reminderHistory.map((entry) => (
              <div key={entry.time} className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{entry.time}</span>
                  <span>Reminder</span>
                </div>
                <p className="mt-2 text-sm text-slate-100">{entry.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card-calm border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.activityTimeline.map((entry) => (
              <div key={entry.time} className="rounded-2xl border border-slate-300/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{entry.time}</span>
                  <span>{group.health}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{entry.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{entry.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
