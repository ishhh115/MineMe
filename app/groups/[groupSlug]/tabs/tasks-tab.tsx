"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SearchIcon, EyeIcon, MoreHorizontalIcon } from "lucide-react"

type Task = {
  _id: string
  taskText?: string
  assignedTo?: string
  deadline?: string
  urgency?: string
  status?: string
  source?: string
  originalMessage?: string
  createdAt?: string
}

function getUrgencyStyle(urgency?: string) {
  switch (urgency) {
    case "high": return "border-red-400/30 bg-red-500/10 text-red-300"
    case "medium": return "border-amber-400/30 bg-amber-500/10 text-amber-300"
    default: return "border-blue-400/30 bg-blue-500/10 text-blue-300"
  }
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "completed": return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    case "pending": return "border-slate-400/30 bg-slate-500/10 text-slate-300"
    case "snoozed": return "border-amber-400/30 bg-amber-500/10 text-amber-300"
    default: return "border-slate-400/30 bg-slate-500/10 text-slate-300"
  }
}

function capitalize(s?: string) {
  if (!s) return "—"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "No deadline"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) +
    "\n" + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const PAGE_SIZE = 10

export function TasksTab({ tasks }: { tasks: Task[] }) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [priorityFilter, setPriorityFilter] = React.useState("All")
  const [assigneeFilter, setAssigneeFilter] = React.useState("All")
  const [page, setPage] = React.useState(1)

  const assignees = React.useMemo(() => {
    const s = new Set(tasks.map(t => t.assignedTo).filter(Boolean))
    return ["All", ...Array.from(s)] as string[]
  }, [tasks])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      const matchSearch = !q || (t.taskText || "").toLowerCase().includes(q) || (t.assignedTo || "").toLowerCase().includes(q)
      const matchStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase()
      const matchPriority = priorityFilter === "All" || t.urgency === priorityFilter.toLowerCase()
      const matchAssignee = assigneeFilter === "All" || t.assignedTo === assigneeFilter
      return matchSearch && matchStatus && matchPriority && matchAssignee
    })
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search tasks..."
            className="h-9 pl-9 border-slate-700 bg-slate-900/50 text-sm text-white placeholder:text-slate-500" />
        </div>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none">
          <option value="All">Status: All</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Snoozed">Snoozed</option>
        </select>

        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none">
          <option value="All">Priority: All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select value={assigneeFilter} onChange={e => { setAssigneeFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none">
          {assignees.map(a => <option key={a} value={a}>{a === "All" ? "Assignee: All" : a}</option>)}
        </select>

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-9 border-slate-700 text-slate-400">
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/60 hover:bg-slate-900/60">
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pl-5">Task</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Assignee</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Priority ↕</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Status ↕</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Deadline ↕</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Created At ↕</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((task) => (
              <TableRow key={task._id} className="border-slate-800 hover:bg-slate-900/40">
                <TableCell className="pl-5 py-4 text-sm font-medium text-white max-w-[220px] truncate">
                  {task.taskText || "—"}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                      {(task.assignedTo || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-200">{task.assignedTo || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={cn("text-[11px] font-medium", getUrgencyStyle(task.urgency))}>
                    {capitalize(task.urgency)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={cn("text-[11px] font-medium", getStatusStyle(task.status))}>
                    {capitalize(task.status)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-xs text-slate-300 whitespace-pre-line">{formatDate(task.deadline)}</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-xs text-slate-300 whitespace-pre-line">{formatDate(task.createdAt)}</div>
                </TableCell>
                <TableCell className="pr-5 py-4">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="size-8 p-0 text-slate-400 hover:text-white">
                      <EyeIcon className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="size-8 p-0 text-slate-400 hover:text-white">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-slate-400">
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tasks</span>
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