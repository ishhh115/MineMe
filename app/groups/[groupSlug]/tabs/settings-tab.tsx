"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SettingsIcon, WifiIcon, BellRingIcon, PauseCircleIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

type Group = {
  _id: string
  name?: string
  chatId?: string
  isMonitoring?: boolean
  lastMessageAt?: string
  messagesCount?: number
  description?: string
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

export function SettingsTab({ group }: { group: Group }) {
  return (
    <div className="space-y-4 max-w-2xl">
      {/* General */}
      <Card className="border border-slate-800 bg-slate-900/50">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-white">General</p>
          <div className="space-y-3 divide-y divide-slate-800">
            <div className="flex items-center justify-between pt-0">
              <div>
                <p className="text-sm text-slate-200">Group Name</p>
                <p className="text-xs text-slate-400">{group.name}</p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 text-xs">Edit</Button>
            </div>
            <div className="flex items-start justify-between pt-3">
              <div>
                <p className="text-sm text-slate-200">Description</p>
                <p className="text-xs text-slate-400 max-w-xs">{group.description || "Official test group for operations monitoring"}</p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 text-xs">Edit</Button>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-sm text-slate-200">WhatsApp Chat ID</p>
                <p className="font-mono text-xs text-slate-400">{group.chatId || "—"}</p>
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
            <Button variant="outline" className="border-slate-700 text-slate-300 text-sm">
              <PauseCircleIcon className="mr-1.5 size-4" />
              {group.isMonitoring ? "Pause Monitoring" : "Resume Monitoring"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
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
    </div>
  )
}