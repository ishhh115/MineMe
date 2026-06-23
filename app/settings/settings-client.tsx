"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  BuildingIcon,
  MessageCircleIcon,
  BellIcon,
  UsersIcon,
  LifeBuoyIcon,
  CheckCircle2Icon,
  CopyIcon,
  CheckIcon,
  ChevronRightIcon,
  ShieldIcon,
  BookOpenIcon,
  MailIcon,
  AlertCircleIcon,
  ZapIcon,
  PhoneIcon,
  WifiIcon,
} from "lucide-react"

type Organisation = {
  _id: string
  name: string
  plan: string
  botPhoneNumber: string
  inviteCode: string
  webhookUrl: string
  notificationPreferences: {
    whatsapp: boolean
    email: boolean
    urgentOnly: boolean
  }
}

type Stats = {
  totalGroups: number
  activeGroups: number
  totalMembers: number
  adminCount: number
  managerCount: number
  memberCount: number
  guestCount: number
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
    >
      {copied ? <CheckIcon className="size-3 text-emerald-400" /> : <CopyIcon className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        enabled ? "bg-emerald-500" : "bg-slate-700"
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-4" : "translate-x-1"
        )}
      />
    </button>
  )
}

export function SettingsClient({
  organisation,
  stats,
}: {
  organisation: Organisation
  stats: Stats
}) {
  const [prefs, setPrefs] = useState(organisation.notificationPreferences)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const planLabel =
    organisation.plan === "enterprise"
      ? "Enterprise"
      : organisation.plan === "pro"
      ? "Pro"
      : "Free"

  const planColor =
    organisation.plan === "enterprise"
      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
      : organisation.plan === "pro"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
      : "border-slate-600 bg-slate-800/50 text-slate-400"

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const savePrefs = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: prefs }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Failed to save")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-800 pb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <BuildingIcon className="size-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Manage your organisation, team, and notification preferences
          </p>
        </div>
      </div>

      {/* ── 1. Organisation Overview ── */}
      <Card className="border border-slate-800 bg-slate-950/50">
        <CardHeader className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <BuildingIcon className="size-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-white">
              Organisation Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-white">
                {organisation.name || "Your Organisation"}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[11px]", planColor)}>
                  <ZapIcon className="mr-1 size-2.5" />
                  {planLabel} Plan
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300">
                  <CheckCircle2Icon className="mr-1 size-2.5" />
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Groups", value: stats.totalGroups, color: "text-white" },
              { label: "Active Groups", value: stats.activeGroups, color: "text-emerald-400" },
              { label: "Team Members", value: stats.totalMembers, color: "text-blue-400" },
              { label: "Admins", value: stats.adminCount, color: "text-violet-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 2. WhatsApp Connection ── */}
      <Card className="border border-slate-800 bg-slate-950/50">
        <CardHeader className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold text-white">
                WhatsApp Connection
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                organisation.botPhoneNumber
                  ? "border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-300"
              }
            >
              <WifiIcon className="mr-1 size-2.5" />
              {organisation.botPhoneNumber ? "Connected" : "Not connected"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Your MindMe bot number for WhatsApp group monitoring
          </p>
        </CardHeader>
        <CardContent className="px-6 py-5 space-y-5">

          {/* Bot number */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Bot Phone Number
            </p>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <PhoneIcon className="size-4 text-emerald-400" />
                <span className="font-mono text-sm text-white">
                  {organisation.botPhoneNumber || "Not set — contact support"}
                </span>
              </div>
              {organisation.botPhoneNumber && (
                <CopyButton text={organisation.botPhoneNumber} />
              )}
            </div>
          </div>

          {/* How to connect */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              How to Connect a WhatsApp Group
            </p>
            <div className="space-y-2">
              {[
                { step: "1", text: `Add ${organisation.botPhoneNumber || "the MindMe bot number"} to your WhatsApp group` },
                { step: "2", text: "Open the Groups page from the sidebar" },
                { step: "3", text: 'Click "Add Group" to see available groups' },
                { step: "4", text: "Select your group and click Import" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                    {item.step}
                  </span>
                  <p className="text-sm text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/groups">
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Go to Groups
                <ChevronRightIcon className="ml-1.5 size-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Notification Preferences ── */}
      <Card className="border border-slate-800 bg-slate-950/50">
        <CardHeader className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-white">
              Notification Preferences
            </CardTitle>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Choose how MindMe sends task reminders to your team
          </p>
        </CardHeader>
        <CardContent className="px-6 py-2">
          {[
            {
              key: "whatsapp" as const,
              icon: MessageCircleIcon,
              label: "WhatsApp Reminders",
              description: "Send automated reminders back to the WhatsApp group",
            },
            {
              key: "email" as const,
              icon: MailIcon,
              label: "Email Reminders",
              description: "Send task reminders to registered email addresses",
            },
            {
              key: "urgentOnly" as const,
              icon: AlertCircleIcon,
              label: "Urgent Alerts Only",
              description: "Only notify for tasks marked as high priority",
            },
          ].map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between border-b border-slate-800/60 py-4 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <pref.icon className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.description}</p>
                </div>
              </div>
              <Toggle
                enabled={!!prefs[pref.key]}
                onChange={() => togglePref(pref.key)}
              />
            </div>
          ))}

          {error && <p className="pb-3 text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-end py-4">
            <Button
              size="sm"
              onClick={savePrefs}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saved ? (
                <>
                  <CheckIcon className="mr-1.5 size-3.5" />
                  Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Team Access ── */}
      <Card className="border border-slate-800 bg-slate-950/50">
        <CardHeader className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold text-white">
                Team Access
              </CardTitle>
            </div>
            <Link href="/groups">
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-slate-700 text-xs text-slate-400 hover:text-white"
              >
                Manage Team
                <ChevronRightIcon className="ml-1 size-3" />
              </Button>
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            People with access to this organisation's dashboard
          </p>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { role: "Admins", count: stats.adminCount, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
              { role: "Managers", count: stats.managerCount, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { role: "Members", count: stats.memberCount, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { role: "Guests", count: stats.guestCount, color: "text-slate-400", bg: "bg-slate-800/50", border: "border-slate-700" },
            ].map((r) => (
              <div
                key={r.role}
                className={cn("rounded-lg border p-3", r.border, r.bg)}
              >
                <p className={cn("text-2xl font-black", r.color)}>{r.count}</p>
                <p className="mt-0.5 text-xs text-slate-500">{r.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
            <ShieldIcon className="size-4 shrink-0 text-slate-500" />
            <p className="text-xs text-slate-500">
              Invite new team members from the Members tab inside any group, or manage roles directly from the group detail page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Support & Resources ── */}
      <Card className="border border-slate-800 bg-slate-950/50">
        <CardHeader className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <LifeBuoyIcon className="size-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-white">
              Support & Resources
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-2">
          {[
            {
              icon: BookOpenIcon,
              label: "Documentation",
              description: "Learn how to get the most out of MindMe",
              href: "#",
            },
            {
              icon: MailIcon,
              label: "Contact Support",
              description: "Get help from the MindMe team",
              href: "mailto:support@mindme.app",
            },
            {
              icon: AlertCircleIcon,
              label: "Report an Issue",
              description: "Something not working? Let us know",
              href: "mailto:bugs@mindme.app",
            },
          ].map((item) => (
            
            <a
              key={item.label}
              href={item.href}
              className="flex items-center justify-between border-b border-slate-800/60 py-4 last:border-0 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800">
                  <item.icon className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <ChevronRightIcon className="size-4 text-slate-600" />
            </a>
          ))}
        </CardContent>
      </Card>

    </div>
  )
}