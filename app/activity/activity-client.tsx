"use client"

import {
  Activity,
  CheckCircle2,
  Trash2,
  Clock3,
  Users,
  Bell,
} from "lucide-react"

function getIcon(type: string) {
  switch (type) {
    case "task_completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />

    case "task_deleted":
      return <Trash2 className="h-5 w-5 text-red-500" />

    case "task_snoozed":
      return <Clock3 className="h-5 w-5 text-yellow-500" />

    case "group_imported":
      return <Users className="h-5 w-5 text-blue-500" />

    default:
      return <Bell className="h-5 w-5 text-primary" />
  }
}

export default function ActivityClient({
  activities,
}: {
  activities: any[]
}) {
  const todayCount = activities.filter(
    (a) =>
      new Date(a.createdAt).toDateString() ===
      new Date().toDateString()
  ).length

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">

      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          Activity Feed
        </h1>

        <p className="mt-2 text-muted-foreground">
          Monitor all activity happening across your organisation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-10">

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Total Events
          </p>

          <p className="mt-3 text-4xl font-bold">
            {activities.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Today's Activity
          </p>

          <p className="mt-3 text-4xl font-bold">
            {todayCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            System Status
          </p>

          <p className="mt-3 font-semibold text-green-500">
            ● Operational
          </p>
        </div>

      </div>

      <div className="relative">

        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">

          {activities.map((activity) => (

            <div
              key={activity._id}
              className="relative flex gap-5"
            >

              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-card">
                {getIcon(activity.type)}
              </div>

              <div className="flex-1 rounded-2xl border bg-card p-5 hover:border-primary/30 transition-all">

                <div className="flex items-start justify-between">

                  <div>
                    <h3 className="font-semibold text-lg">
                      {activity.title}
                    </h3>

                    <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-sm">
                        {activity.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {new Date(
                        activity.createdAt
                      ).toLocaleDateString()}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        activity.createdAt
                      ).toLocaleTimeString()}
                    </p>
                  </div>

                </div>

              </div>

            </div>

          ))}

          {activities.length === 0 && (
            <div className="rounded-2xl border p-12 text-center">
              <Activity className="mx-auto h-10 w-10 opacity-50" />

              <p className="mt-4 text-muted-foreground">
                No activity yet
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}