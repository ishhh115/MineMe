"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SettingsIcon, WifiIcon, BellRingIcon, PauseCircleIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Group = {
  _id: string
  name?: string
  chatId?: string
  isMonitoring?: boolean
  lastMessageAt?: string
  messagesCount?: number
  description?: string

  pendingCount?: number
  completedCount?: number
  snoozedCount?: number
  totalTasks?: number
  tasksExtracted?: number
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

export function SettingsTab({
  group,
  currentUserRole,
}: {
  group: Group
  currentUserRole: string
}) {
  const [loading, setLoading] =
    React.useState(false)
    

const [name, setName] =
  React.useState(group.name || "")

const [description, setDescription] =
  React.useState(group.description || "")

  const [editing, setEditing] =
  React.useState(false)

  async function saveGroupSettings() {
  try {
    const res = await fetch(
      "/api/groups/update",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: group._id,
          name,
          description,
        }),
      }
    )

    if (!res.ok) {
      toast.error("Failed to update group")
      return
    }

    toast.success(
  "Group settings updated"
)

setTimeout(() => {
  window.location.reload()
}, 1000)
  } catch {
    toast.error("Failed to update group")
  }
}

  async function toggleMonitoring() {
  setLoading(true)

  try {
    const res = await fetch(
      "/api/groups/monitoring",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: group._id,
          isMonitoring: !group.isMonitoring,
        }),
      }
    )

    if (!res.ok) {
      toast.error(
        "Failed to update monitoring"
      )
      return
    }

    toast.success(
      group.isMonitoring
        ? "Monitoring paused"
        : "Monitoring resumed"
    )

    window.location.reload()
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="space-y-4 max-w-2xl">
      {/* General */}
<Card className="border border-slate-800 bg-slate-900/50">
  <CardContent className="p-5">
    <p className="mb-4 text-sm font-semibold text-white">
      General
    </p>

    <div className="space-y-4">

      {/* Group Name */}
      <div>
        <p className="mb-2 text-sm text-slate-200">
          Group Name
        </p>

        {editing ? (
  <input
    value={name}
    onChange={(e) =>
      setName(e.target.value)
    }
    className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm"
  />
) : (
  <p className="text-sm text-slate-400">
    {group.name}
  </p>
)}
      </div>

      {/* Description */}
      <div>
        <p className="mb-2 text-sm text-slate-200">
          Description
        </p>

        {editing ? (
  <textarea
    value={description}
    onChange={(e) =>
      setDescription(e.target.value)
    }
    rows={4}
    className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm"
  />
) : (
  <p className="text-sm text-slate-400 whitespace-pre-wrap">
    {group.description ||
      "No description"}
  </p>
)}
      </div>

      {/* WhatsApp Chat ID */}
      <div>
        <p className="mb-2 text-sm text-slate-200">
          WhatsApp Chat ID
        </p>

        <p className="font-mono text-xs text-slate-400 break-all">
          {group.chatId || "—"}
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <div className="flex justify-end gap-2">
  {editing ? (
    <>
<Button
  variant="outline"
  onClick={() => {
    setName(group.name || "")
    setDescription(
      group.description || ""
    )

    setEditing(false)

    toast.info(
      "Changes discarded"
    )
  }}
>
  Cancel
</Button>

      <Button
  onClick={async () => {
    await saveGroupSettings()

    setEditing(false)
  }}
  className="bg-emerald-600 hover:bg-emerald-700"
>
  Save Changes
</Button>
    </>
  ) : (
    <Button
      onClick={() =>
        setEditing(true)
      }
      variant="outline"
    >
      Edit
    </Button>
  )}
</div>
      </div>

    </div>
  </CardContent>
</Card>

      {/* Monitoring */}
      <Card className="border border-slate-800 bg-slate-900/50">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Monitoring</p>
          <div className="space-y-3 divide-y divide-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <WifiIcon className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-200">Webhook Status</p>
                  <p className="text-xs text-slate-400">Last synced {timeAgo(group.lastMessageAt)}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[11px]", group.isMonitoring
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600 bg-slate-800 text-slate-400")}>
                {group.isMonitoring ? "Active" : "Paused"}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2">
                  <BellRingIcon className="size-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-200">Auto Reminders</p>
                  <p className="text-xs text-slate-400">Send reminders for pending tasks</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-[11px]">
                Enabled
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
  variant="outline"
  disabled={loading}
  onClick={toggleMonitoring}
  className="border-slate-700 text-slate-300 text-sm"
>
              <PauseCircleIcon className="mr-1.5 size-4" />
              
  {loading
    ? "Updating..."
    : group.isMonitoring
    ? "Pause Monitoring"
    : "Resume Monitoring"}
            </Button>
          </div>
        </CardContent>
      </Card>


      <Card className="border border-slate-800 bg-slate-900/50">
  <CardContent className="p-5">
    <p className="mb-4 text-sm font-semibold text-white">
      Group Health
    </p>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-slate-400">
          Messages Processed
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {group.messagesCount || 0}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Tasks Extracted
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {group.tasksExtracted || 0}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Pending Tasks
        </p>

        <p className="mt-1 text-xl font-bold text-amber-400">
          {group.pendingCount || 0}
        </p>
      </div>

      <div>
  <p className="text-xs text-slate-400">
    Snoozed Tasks
  </p>

  <p className="mt-1 text-xl font-bold text-blue-400">
    {group.snoozedCount || 0}
  </p>
</div>

        <div>
        <p className="text-xs text-slate-400">
          Completed Tasks
        </p>

        <p className="mt-1 text-xl font-bold text-emerald-400">
          {group.completedCount || 0}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Completion Rate
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {group.totalTasks
            ? Math.round(
                ((group.completedCount || 0) /
                  group.totalTasks) *
                  100
              )
            : 0}
          %
        </p>
      </div>
    </div>
  </CardContent>
</Card>

      {/* Danger Zone */}
      {currentUserRole === "admin" && (
      <Card className="border border-red-500/20 bg-red-500/5">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-semibold text-red-400">Danger Zone</p>
          <p className="text-xs text-slate-400">These actions are irreversible. Please be careful.</p>
          <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm">
            <Trash2Icon className="mr-1.5 size-4" />
            Delete Group
          </Button>
        </CardContent>
      </Card>
      )}
    </div>
  )
}