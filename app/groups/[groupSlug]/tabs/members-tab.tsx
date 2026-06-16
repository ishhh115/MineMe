"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SearchIcon, MoreHorizontalIcon } from "lucide-react"

type Task = {
  _id: string
  assignedTo?: string
  status?: string
  createdAt?: string
}

const PAGE_SIZE = 10

export function MembersTab({ tasks, participants }: { tasks: Task[]; participants?: number }) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Derive members from task assignees
  const members = React.useMemo(() => {
    const map: Record<string, { total: number; completed: number; pending: number }> = {}
    tasks.forEach((t) => {
      if (t.assignedTo) {
        if (!map[t.assignedTo]) map[t.assignedTo] = { total: 0, completed: 0, pending: 0 }
        map[t.assignedTo].total++
        if (t.status === "completed") map[t.assignedTo].completed++
        if (t.status === "pending") map[t.assignedTo].pending++
      }
    })
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({ name, ...data }))
  }, [tasks])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter(m => !q || m.name.toLowerCase().includes(q))
  }, [members, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Avatar color palette
  const colors = [
    "bg-violet-600", "bg-emerald-600", "bg-blue-600",
    "bg-amber-600", "bg-rose-600", "bg-cyan-600",
  ]

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative w-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search members..."
            className="h-9 pl-9 border-slate-700 bg-slate-900/50 text-sm text-white placeholder:text-slate-500" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/60 hover:bg-slate-900/60">
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pl-5">Member</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Role</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Tasks Assigned</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Completed</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Pending</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Joined On</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((member, idx) => (
              <TableRow key={member.name} className="border-slate-800 hover:bg-slate-900/40">
                <TableCell className="pl-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", colors[idx % colors.length])}>
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.name.toLowerCase().replace(/\s+/g, "")}@gmail.com</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={cn("text-[11px] font-medium",
                    idx === 0 || member.total > 15
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-600 bg-slate-800/50 text-slate-300"
                  )}>
                    {idx === 0 || member.total > 15 ? "⭐ Admin" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-sm font-semibold text-white">{member.total}</TableCell>
                <TableCell className="py-4 text-sm font-semibold text-emerald-300">{member.completed}</TableCell>
                <TableCell className="py-4 text-sm font-semibold text-amber-300">{member.pending}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-[11px]">
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-400">
                  12 May 2024
                </TableCell>
                <TableCell className="pr-5 py-4">
                  <Button size="sm" variant="ghost" className="size-8 p-0 text-slate-400 hover:text-white">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-sm text-slate-400">
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing 1 to {paginated.length} of {participants ?? filtered.length} members</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-slate-700 text-slate-400"
            disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <Button key={p} size="sm" variant={page === p ? "default" : "outline"}
              className={cn("h-7 w-7 p-0 border-slate-700", page === p ? "bg-emerald-600 text-white border-emerald-600" : "text-slate-400")}
              onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-slate-700 text-slate-400"
            disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
        </div>
      </div>
    </div>
  )
}