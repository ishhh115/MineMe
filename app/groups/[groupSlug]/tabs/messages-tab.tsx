"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SearchIcon, EyeIcon, MoreHorizontalIcon, FileIcon, ImageIcon, MessageCircleIcon } from "lucide-react"

type Message = {
  _id: string
  text?: string
  sender?: string
  timestamp?: string
  isTask?: boolean
  messageType?: string
}

const PAGE_SIZE = 10

export function MessagesTab({ messages, messagesCount }: { messages: Message[]; messagesCount?: number }) {
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("All")
  const [fromFilter, setFromFilter] = React.useState("All")
  const [page, setPage] = React.useState(1)

  const senders = React.useMemo(() => {
    const s = new Set(messages.map(m => m.sender).filter(Boolean))
    return ["All", ...Array.from(s)] as string[]
  }, [messages])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages.filter(m => {
      const matchSearch = !q || (m.text || "").toLowerCase().includes(q) || (m.sender || "").toLowerCase().includes(q)
      const matchFrom = fromFilter === "All" || m.sender === fromFilter
      return matchSearch && matchFrom
    })
  }, [messages, search, typeFilter, fromFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function getTypeIcon(msg: Message) {
    if (msg.messageType === "image") return <ImageIcon className="size-3.5" />
    if (msg.messageType === "document") return <FileIcon className="size-3.5" />
    return <MessageCircleIcon className="size-3.5" />
  }

  function getTypeLabel(msg: Message) {
    if (msg.messageType === "image") return "Image"
    if (msg.messageType === "document") return "Document"
    return "Text"
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search messages..."
            className="h-9 pl-9 border-slate-700 bg-slate-900/50 text-sm text-white placeholder:text-slate-500" />
        </div>

        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none">
          <option value="All">Type: All</option>
          <option value="Text">Text</option>
          <option value="Image">Image</option>
          <option value="Document">Document</option>
        </select>

        <select value={fromFilter} onChange={e => { setFromFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none">
          {senders.map(s => <option key={s} value={s}>{s === "All" ? "From: All" : s}</option>)}
        </select>

        <input type="date" className="h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-slate-300 focus:outline-none" />

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-9 border-slate-700 text-slate-400">Filter</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/60 hover:bg-slate-900/60">
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pl-5">Message</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Sender</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Type</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Time</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((msg) => (
              <TableRow key={msg._id} className="border-slate-800 hover:bg-slate-900/40">
                <TableCell className="pl-5 py-4 text-sm text-slate-200 max-w-[260px] truncate">
                  {msg.text || "—"}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                      {(msg.sender || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-200">{msg.sender || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {getTypeIcon(msg)}
                    {getTypeLabel(msg)}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-xs text-slate-300">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-[11px]">
                    Processed
                  </Badge>
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
                <TableCell colSpan={6} className="py-16 text-center text-sm text-slate-400">
                  No messages found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} messages</span>
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