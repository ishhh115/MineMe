"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Settings2Icon,
  MessageCircleIcon,
  BellIcon,
  KeyIcon,
  PhoneIcon,
  MailIcon,
  CheckCircleIcon,
  SaveIcon,
} from "lucide-react"

type SettingsGroup = {
  _id: string
  name?: string
  participants?: number
  isMonitoring?: boolean
}

type SettingsOrganisation = {
  _id: string
  name?: string
  whapiToken?: string
  botPhoneNumber?: string
  webhookUrl?: string
  notificationPreferences?: {
    whatsapp?: boolean
    email?: boolean
    urgentOnly?: boolean
  }
}

export function SettingsClient({
  organisation,
  groups,
}: {
  organisation: SettingsOrganisation
  groups: SettingsGroup[]
}) {
  const [whapiToken, setWhapiToken] = useState(organisation.whapiToken || "")
  const [botPhoneNumber, setBotPhoneNumber] = useState(organisation.botPhoneNumber || "")
  const [webhookUrl] = useState(organisation.webhookUrl || "")
  const [notificationPreferences, setNotificationPreferences] = useState(
    organisation.notificationPreferences || { whatsapp: true, email: false, urgentOnly: false }
  )
  const [groupState, setGroupState] = useState<SettingsGroup[]>(groups || [])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const connected = Boolean(whapiToken.trim())

  const activeGroups = useMemo(
    () => groupState.filter((group) => group.isMonitoring).length,
    [groupState]
  )

  const toggleGroup = (groupId: string) => {
    setGroupState((prev) =>
      prev.map((group) =>
        group._id === groupId ? { ...group, isMonitoring: !group.isMonitoring } : group
      )
    )
  }

  const togglePreference = (key: keyof typeof notificationPreferences) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whapiToken,
          botPhoneNumber,
          webhookUrl,
          notificationPreferences,
          groups: groupState.map((group) => ({
            _id: group._id,
            isMonitoring: Boolean(group.isMonitoring),
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to save settings")
        setSaving(false)
        return
      }

      setMessage(data.message || "Settings saved")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-shell relative w-full overflow-hidden">
      <div className="dashboard-noise" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-1 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-400/10 p-2">
              <Settings2Icon className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage your company workspace and notification preferences
              </p>
            </div>
          </div>
        </div>

        <Card className="border-border/40">
          <CardHeader className="border-b border-border/40 px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircleIcon className="size-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold">WhatsApp Integration</CardTitle>
              </div>
              <Badge
                variant="outline"
                className={
                  connected
                    ? "border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
                    : "border-border/30 bg-muted/30 text-xs text-muted-foreground"
                }
              >
                <CheckCircleIcon className="mr-1 size-3" />
                {connected ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect your company&apos;s WhatsApp setup to start monitoring groups
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-6 py-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                WhatsApp API Token
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your WhatsApp API token"
                    className="border-border/40 bg-muted/20 pl-9 text-sm"
                    value={whapiToken}
                    onChange={(e) => setWhapiToken(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  type="button"
                  className="border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save token
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add the token from your WhatsApp integration provider dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Webhook URL
              </label>
              <Input
                readOnly
                value={webhookUrl}
                className="border-border/40 bg-muted/20 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Paste this URL in your provider dashboard under webhook settings
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Connected Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="+91 00000 00000"
                  className="border-border/40 bg-muted/20 pl-9 text-sm"
                  value={botPhoneNumber}
                  onChange={(e) => setBotPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-400">{message}</p>}

            <div className="flex justify-end">
              <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={handleSave} disabled={saving}>
                <SaveIcon className="mr-1.5 size-3.5" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="border-b border-border/40 px-6 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Monitored Groups</CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Toggle which WhatsApp groups the system should monitor
            </p>
          </CardHeader>
          <CardContent className="px-6 py-0">
            {groupState.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">
                No groups are connected yet.
              </div>
            ) : (
              groupState.map((group) => (
                <div key={group._id} className="flex items-center justify-between border-b border-border/20 py-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/10">
                      <MessageCircleIcon className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.name || "Unnamed group"}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.participants ?? 0} participants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        group.isMonitoring
                          ? "border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400"
                          : "border-border/30 bg-muted/30 text-xs text-muted-foreground"
                      }
                    >
                      {group.isMonitoring ? "Monitoring" : "Paused"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group._id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${group.isMonitoring ? "bg-emerald-500" : "bg-muted"}`}
                    >
                      <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${group.isMonitoring ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div className="flex items-center justify-between py-4 text-xs text-muted-foreground">
              <span>{activeGroups} groups monitored</span>
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
                Save group changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="border-b border-border/40 px-6 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <BellIcon className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose how and when you want to receive deadline reminders
            </p>
          </CardHeader>
          <CardContent className="px-6 py-0">
            {[
              {
                key: "whatsapp",
                label: "WhatsApp Reminders",
                description: "Send reminders back to the WhatsApp group",
                icon: MessageCircleIcon,
              },
              {
                key: "email",
                label: "Email Reminders",
                description: "Send reminders to your registered email",
                icon: MailIcon,
              },
              {
                key: "urgentOnly",
                label: "Urgent Alerts Only",
                description: "Only notify for high urgency tasks",
                icon: BellIcon,
              },
            ].map((pref) => {
              const enabled = notificationPreferences[pref.key as keyof typeof notificationPreferences]
              return (
                <div key={pref.key} className="flex items-center justify-between border-b border-border/20 py-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400/10">
                      <pref.icon className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference(pref.key as keyof typeof notificationPreferences)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-muted"}`}
                  >
                    <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                </div>
              )
            })}
            <div className="flex items-center justify-end py-4">
              <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={handleSave} disabled={saving}>
                <SaveIcon className="mr-1.5 size-3.5" />
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}