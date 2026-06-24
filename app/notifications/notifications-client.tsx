"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"

function getStatusStyle(status?: string) {
  switch (status) {
    case "delivered":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-400"
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400"
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-400"
  }
}

function getStatusLabel(status?: string) {
  if (!status) return "Unknown"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function NotificationsClient({
  notifications,
}: {
  notifications: any[]
}) {
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (notifications || []).filter(
      (n) =>
        !q ||
        (n.taskText || "").toLowerCase().includes(q) ||
        (n.groupName || "").toLowerCase().includes(q)
    )
  }, [notifications, search])

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6 max-w-md">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications"
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((n) => (
          <Card key={n._id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-base">
                  {n.taskText}
                </h3>
                <Badge
                  variant="outline"
                  className={getStatusStyle(n.status)}
                >
                  {getStatusLabel(n.status)}
                </Badge>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Group: {n.groupName || "Unknown Group"}
              </p>

              <p className="mt-4 text-xs text-muted-foreground">
                {new Date(n.sentAt || n.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                {new Date(n.sentAt || n.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground">
                No notifications found
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}