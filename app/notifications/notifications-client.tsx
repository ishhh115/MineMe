"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

export default function NotificationsClient({ notifications }: { notifications: any[] }) {
  const [search, setSearch] = React.useState("")
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (notifications || []).filter((n) => !q || (n.message || '').toLowerCase().includes(q) || (n.recipient || '').toLowerCase().includes(q))
  }, [notifications, search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <SearchIcon className="size-4 text-slate-400" />
        <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search notifications" />
        <Button variant="outline">Filters</Button>
      </div>

      <div className="grid gap-4">
        {filtered.map((n) => (
          <Card key={n._id} className="p-3">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{n.taskText || n.message}</CardTitle>
              <Badge variant="outline">{n.channel || n.channel?.toUpperCase?.() || 'WH'}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">To: {n.recipient || n.recipientName || n.recipient}</p>
              <p className="mt-2 text-sm text-slate-100">{n.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
