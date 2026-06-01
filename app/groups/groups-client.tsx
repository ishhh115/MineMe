"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SearchIcon, UsersIcon, FilterIcon } from "lucide-react"

export default function GroupsClient({ groups }: { groups: any[] }) {
  const [search, setSearch] = React.useState("")
  const [healthFilter, setHealthFilter] = React.useState<any>("All")
  const [sortMode, setSortMode] = React.useState("most-active")

  const filteredGroups = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return (groups || [])
      .filter((group) => {
        const matchesSearch = !query || (group.name || '').toLowerCase().includes(query) || (group.category || '').toLowerCase().includes(query)
        const matchesHealth = healthFilter === "All" || (group.health || "") === healthFilter
        return matchesSearch && matchesHealth
      })
  }, [groups, healthFilter, search])

  const clearFilters = () => { setSearch(''); setHealthFilter('All'); setSortMode('most-active') }

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 p-3">
          <UsersIcon className="size-5 text-emerald-300" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">WhatsApp Operations Monitoring</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Groups</h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search groups..." className="h-11 pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>Reset</Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
        {filteredGroups.map((group: any) => (
          <Link key={group._id} href={`/groups/${group._id}`} className="block h-full">
            <Card className="glass-card-calm relative flex h-full flex-col overflow-hidden border border-slate-300/10">
              <CardContent className="relative flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl border border-slate-300/10 bg-slate-900/40 p-3">
                      <UsersIcon className="size-5 text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{group.name}</h3>
                        <Badge variant="outline">{group.health}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{group.participants} participants • {group.lastSync || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border p-3"><p className="text-[11px] text-slate-400">Messages</p><p className="mt-1 text-2xl font-black text-white">{group.messagesCount ?? group.messagesToday ?? 0}</p></div>
                  <div className="rounded-xl border p-3"><p className="text-[11px] text-slate-400">Tasks</p><p className="mt-1 text-2xl font-black text-white">{group.tasksExtracted ?? group.tasksToday ?? 0}</p></div>
                  <div className="rounded-xl border p-3"><p className="text-[11px] text-slate-400">Pending</p><p className="mt-1 text-2xl font-black text-amber-100">{group.overdueCount ?? group.pendingTasks ?? 0}</p></div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
