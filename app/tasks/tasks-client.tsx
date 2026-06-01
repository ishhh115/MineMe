"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { CheckCircle2Icon, CheckSquareIcon, MessageCircleIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react"

type TaskRecord = {
  _id: string
  taskText: string
  assignedTo?: string | null
  deadline?: string | null
  urgency?: "high" | "medium" | "low"
  status?: "pending" | "completed" | "snoozed" | "cancelled"
  source?: "ai" | "manual"
  whatsappStatus?: string | null
  originalMessage?: string | null
  confidence?: number | null
  createdAt?: string | null
  groupName?: string | null
  chatId?: string | null
}

export function TasksClient({ tasks }: { tasks: TaskRecord[] }) {
  const [localTasks, setLocalTasks] = React.useState<TaskRecord[]>(() => tasks ?? [])
  const [search, setSearch] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | "high" | "medium" | "low">("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "completed" | "snoozed" | "cancelled">("all")
  const [selectedTask, setSelectedTask] = React.useState<TaskRecord | null>(null)
  const [loadingAction, setLoadingAction] = React.useState(false)
  const [newAssignee, setNewAssignee] = React.useState("")
  const [newAssigneeId, setNewAssigneeId] = React.useState<string | null>(null)
  const [users, setUsers] = React.useState<Array<{_id:string; name:string; email?:string}>>([])
  const [userQuery, setUserQuery] = React.useState("")
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1)
  const [debouncedUserQuery, setDebouncedUserQuery] = React.useState("")

  // debounce user query
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedUserQuery(userQuery), 300)
    return () => clearTimeout(t)
  }, [userQuery])

  // fetch users when debounced query changes
  React.useEffect(() => {
    let mounted = true
    if (!debouncedUserQuery || debouncedUserQuery.length < 1) {
      setUsers([])
      return
    }

    setUserDropdownOpen(true)
    fetch(`/api/users/list?q=${encodeURIComponent(debouncedUserQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (Array.isArray(data)) setUsers(data)
      })
      .catch(() => {
        if (!mounted) return
        setUsers([])
      })

    return () => {
      mounted = false
    }
  }, [debouncedUserQuery])
  const [newDeadlineLocal, setNewDeadlineLocal] = React.useState("") // datetime-local value

  React.useEffect(() => {
    setLocalTasks(tasks ?? [])
  }, [tasks])

  const visibleTasks = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return localTasks
      .filter((t) => {
        const matchesSearch = !q || t.taskText.toLowerCase().includes(q) || (t.assignedTo || "").toLowerCase().includes(q) || (t.groupName || "").toLowerCase().includes(q)
        const matchesPriority = priorityFilter === "all" || t.urgency === priorityFilter
        const matchesStatus = statusFilter === "all" || t.status === statusFilter
        return matchesSearch && matchesPriority && matchesStatus
      })
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return db - da
      })
  }, [localTasks, priorityFilter, search, statusFilter])

  const counts = React.useMemo(() => ({
    total: localTasks.length,
    pending: localTasks.filter((t) => t.status === "pending").length,
    completed: localTasks.filter((t) => t.status === "completed").length,
    urgent: localTasks.filter((t) => t.urgency === "high" && t.status === "pending").length,
  }), [localTasks])

  async function confirmCompleted(taskId: string) {
    setLoadingAction(true)
    try {
      const res = await fetch('/api/tasks/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'completed' }),
      })
      const j = await res.json()
        if (j.ok) {
          setLocalTasks((cur) => cur.map((t) => t._id === taskId ? { ...t, status: 'completed' } : t))
          if (selectedTask?._id === taskId) setSelectedTask({ ...(selectedTask as TaskRecord), status: 'completed' })
        }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAction(false)
    }
  }

  async function snoozeOneDay(taskId: string) {
    setLoadingAction(true)
    try {
      const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch('/api/tasks/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, snoozeUntil }),
      })
      const j = await res.json()
      if (j.ok) {
        setLocalTasks((cur) => cur.map((t) => t._id === taskId ? { ...t, status: 'snoozed' } : t))
        if (selectedTask?._id === taskId) setSelectedTask({ ...(selectedTask as TaskRecord), status: 'snoozed' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAction(false)
    }
  }

  async function resendReminder(taskId: string) {
    setLoadingAction(true)
    try {
      const res = await fetch('/api/tasks/resend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId })
      })
      const j = await res.json()
      if (j.ok) {
        // optionally show toast
        console.log('resend queued')
      }
    } catch (err) { console.error(err) }
    finally { setLoadingAction(false) }
  }

  async function submitDeadlineEdit(taskId: string) {
    if (!newDeadlineLocal) return
    setLoadingAction(true)
    try {
      const iso = new Date(newDeadlineLocal).toISOString()
      const res = await fetch('/api/tasks/edit-deadline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, newDeadline: iso }) })
      const j = await res.json()
      if (j.ok) {
        setLocalTasks((cur) => cur.map((t) => t._id === taskId ? { ...t, deadline: iso } : t))
        if (selectedTask?._id === taskId) setSelectedTask({ ...(selectedTask as TaskRecord), deadline: iso })
        setNewDeadlineLocal("")
      }
    } catch (err) { console.error(err) }
    finally { setLoadingAction(false) }
  }

  async function submitReassign(taskId: string) {
    if (!newAssigneeId || !newAssignee) return
    setLoadingAction(true)
    try {
      const res = await fetch('/api/tasks/reassign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId, assignee: newAssigneeId }) })
      const j = await res.json()
      if (j.ok) {
        setLocalTasks((cur) => cur.map((t) => t._id === taskId ? { ...t, assignedTo: newAssignee } : t))
        if (selectedTask?._id === taskId) setSelectedTask({ ...(selectedTask as TaskRecord), assignedTo: newAssignee })
        setNewAssignee("")
        setNewAssigneeId(null)
        setUserQuery("")
        setUserDropdownOpen(false)
      }
    } catch (err) { console.error(err) }
    finally { setLoadingAction(false) }
  }

  async function performDelete(taskId: string) {
    const ok = confirm('Delete this task? This cannot be undone.')
    if (!ok) return
    setLoadingAction(true)
    try {
      const res = await fetch('/api/tasks/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) })
      const j = await res.json()
      if (j.ok) {
        setLocalTasks((cur) => cur.filter((t) => t._id !== taskId))
        setSelectedTask(null)
      }
    } catch (err) { console.error(err) }
    finally { setLoadingAction(false) }
  }

  function formatDeadline(dateStr?: string | null) {
    if (!dateStr) return 'No deadline'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleString()
  }

  function capitalize(v?: string | null) { if (!v) return '—'; return v.charAt(0).toUpperCase() + v.slice(1) }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 md:hidden" />
            <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 p-3">
              <CheckSquareIcon className="size-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Active Tasks</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Operational Tasks</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Click any task row to inspect the original WhatsApp message, reminders, assignment, deadline, and operational status.</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Badge variant="outline" className="justify-start border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-rose-200">{counts.urgent} Urgent</Badge>
            <Badge variant="outline" className="justify-start border-slate-300/20 bg-slate-500/10 px-3 py-1.5 text-slate-100">{counts.total} Total Tasks</Badge>
            <Badge variant="outline" className="justify-start border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-amber-100">{counts.pending} Awaiting Response</Badge>
            <Badge variant="outline" className="justify-start border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-100">{counts.completed} Completed</Badge>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr_auto] lg:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks, people, groups, WhatsApp messages..." className="h-11 border-slate-300/15 bg-slate-900/35 pl-9 text-sm text-white placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400"> <SparklesIcon className="size-3.5" /> Auto Extracted + Manual</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setSearch(''); setPriorityFilter('all'); setStatusFilter('all') }} className="h-11">Reset</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Priority</span>
          {(["all","high","medium","low"] as const).map((p)=> (
            <button key={p} onClick={()=>setPriorityFilter(p)} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium', priorityFilter===p? 'bg-slate-800 text-white':'bg-slate-900/30 text-slate-300')}>{p==='all'? 'All' : capitalize(p)}</button>
          ))}

          <span className="mx-1 hidden h-4 w-px bg-slate-300/10 sm:block" />
          <span className="text-xs text-slate-400">Status</span>
          {(["all","pending","completed"] as const).map((s)=> (
            <button key={s} onClick={()=>setStatusFilter(s)} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium', statusFilter===s? 'bg-slate-800 text-white':'bg-slate-900/30 text-slate-300')}>{s==='all'? 'All' : capitalize(s)}</button>
          ))}
        </div>
      </div>

      <Card className="border border-slate-300/10 bg-slate-950/35">
        <CardHeader className="border-b border-slate-300/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-white">All Tasks</CardTitle>
              <p className="mt-1 text-xs text-slate-400">{visibleTasks.length} task{visibleTasks.length===1?'':'s'} visible</p>
            </div>
            <div className="text-xs text-slate-400">Auto Extracted + Manual</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 text-[11px] uppercase tracking-[0.18em] text-slate-400">Task</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Assigned To</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Group</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">WhatsApp Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Delivery</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Deadline</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Priority</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Status</TableHead>
                <TableHead className="pr-6 text-[11px] uppercase tracking-[0.18em] text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTasks.length>0? visibleTasks.map((task)=> (
                <TableRow key={task._id} className="cursor-pointer hover:bg-slate-900/45" onClick={()=>setSelectedTask(task)}>
                  <TableCell className="pl-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{task.taskText}</p>
                        <Badge variant="outline" className="text-[10px]">{task.source==='manual'? 'Manual':'Auto Extracted'}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">Extracted {task.createdAt ? new Date(task.createdAt).toLocaleString() : '—'} • From {task.groupName || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4"><div className="flex items-center gap-2"><div className="rounded-full w-7 h-7 bg-slate-800 flex items-center justify-center text-xs">{(task.assignedTo||'U').slice(0,1)}</div><span className="text-sm">{task.assignedTo || '—'}</span></div></TableCell>
                  <TableCell className="py-4"><span className="text-sm text-slate-200">{task.groupName || '—'}</span></TableCell>
                  <TableCell className="py-4"><Badge variant="outline">{capitalize(task.whatsappStatus||'pending')}</Badge></TableCell>
                  <TableCell className="py-4"><span className="text-sm text-slate-100">Pending</span><div className="text-xs text-slate-400">in queue</div></TableCell>
                  <TableCell className="py-4"><div className="text-sm text-slate-100">{formatDeadline(task.deadline)}</div><div className="text-xs text-slate-400">{task.deadline? 'Due':'No deadline'}</div></TableCell>
                  <TableCell className="py-4"><Badge variant="outline">{capitalize(task.urgency||'low')}</Badge></TableCell>
                  <TableCell className="py-4"><Badge variant="outline">{capitalize(task.status||'pending')}</Badge></TableCell>
                  <TableCell className="pr-6 py-4"><Button size="sm" variant="outline" onClick={(e)=>{e.stopPropagation(); setSelectedTask(task)}}>View Context</Button></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={9} className="py-16 text-center">No matching tasks</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open)=>!open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl border-slate-300/15 bg-slate-950 text-white">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTask.taskText}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-slate-400">Assignee</p>
                  <p className="text-sm text-white">{selectedTask.assignedTo || 'Unassigned'}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-slate-400">WhatsApp Status</p>
                  <p className="text-sm text-white">{capitalize(selectedTask.whatsappStatus||'pending')}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-slate-400">Deadline</p>
                  <p className="text-sm text-white">{formatDeadline(selectedTask.deadline)}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] text-slate-400">Priority</p>
                  <p className="text-sm text-white">{capitalize(selectedTask.urgency||'low')}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border p-4">
                <p className="text-[11px] text-slate-400">Original WhatsApp Message</p>
                <p className="mt-2 text-sm text-slate-100">{selectedTask.originalMessage || '—'}</p>
              </div>

              <div className="mt-4 space-y-2">
                <Button className="w-full bg-emerald-600" onClick={()=>confirmCompleted(selectedTask._id)} disabled={loadingAction}>Confirm Completed</Button>
                <Button className="w-full" variant="outline" onClick={()=>snoozeOneDay(selectedTask._id)} disabled={loadingAction}>Snooze 1 day</Button>
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Button onClick={()=>resendReminder(selectedTask._id)} disabled={loadingAction} variant="outline" className="flex-1">Resend Reminder</Button>
                    <Button onClick={()=>performDelete(selectedTask._id)} disabled={loadingAction} variant="destructive" className="">Delete</Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-slate-400">Reassign to</label>
                      <div className="relative">
                        <Input
                          role="combobox"
                          aria-expanded={userDropdownOpen}
                          aria-controls="assignee-listbox"
                          aria-autocomplete="list"
                          value={userQuery || newAssignee}
                          onChange={(e) => {
                            const q = e.target.value
                            setUserQuery(q)
                            setNewAssignee(q)
                            setNewAssigneeId(null)
                            setUserDropdownOpen(true)
                            if (q.length >= 1) {
                              setDebouncedUserQuery(q)
                            } else {
                              setUsers([])
                            }
                          }}
                          onKeyDown={(e) => {
                            if (!userDropdownOpen) return
                            if (e.key === 'ArrowDown') {
                              e.preventDefault()
                              setHighlightedIndex((i) => Math.min(i + 1, users.length - 1))
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault()
                              setHighlightedIndex((i) => Math.max(i - 1, 0))
                            } else if (e.key === 'Enter') {
                              e.preventDefault()
                              const u = users[highlightedIndex]
                              if (u) {
                                setNewAssignee(u.name)
                                setNewAssigneeId(u._id)
                                setUserQuery("")
                                setUserDropdownOpen(false)
                              }
                            } else if (e.key === 'Escape') {
                              setUserDropdownOpen(false)
                            }
                          }}
                          placeholder="Search users..."
                        />

                        {userDropdownOpen && users.length > 0 && (
                          <div role="listbox" id="assignee-listbox" aria-label="Assignee suggestions" className="absolute z-50 mt-1 w-full rounded-md border bg-slate-900/95">
                            {users.filter(u => (u.name||u.email||u._id).toLowerCase().includes((userQuery||newAssignee).toLowerCase())).slice(0,8).map((u, idx) => (
                              <div
                                key={u._id}
                                role="option"
                                aria-selected={highlightedIndex === idx}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onMouseLeave={() => setHighlightedIndex(-1)}
                                onClick={() => {
                                  setNewAssignee(u.name)
                                  setNewAssigneeId(u._id)
                                  setUserQuery("")
                                  setUserDropdownOpen(false)
                                }}
                                className={"w-full text-left px-3 py-2 " + (highlightedIndex === idx ? 'bg-slate-800/60' : '')}
                              >
                                <div className="text-sm text-slate-100">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email || u._id}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button className="mt-2" onClick={()=>submitReassign(selectedTask._id)} disabled={loadingAction || !newAssigneeId}>Reassign</Button>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Edit deadline</label>
                      <Input type="datetime-local" value={newDeadlineLocal} onChange={(e)=>setNewDeadlineLocal(e.target.value)} />
                      <Button className="mt-2" onClick={()=>submitDeadlineEdit(selectedTask._id)} disabled={loadingAction}>Update Deadline</Button>
                    </div>
                  </div>

                  <Button className="w-full" variant="ghost" onClick={()=>setSelectedTask(null)}>Close</Button>
                </div>
              </div>

            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
