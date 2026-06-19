"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SearchIcon, MoreHorizontalIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

type Task = { _id: string; assignedTo?: string; status?: string }
type User = {
  _id: string
  name?: string
  email?: string
  phone?: string
  role?: string
  isVerified?: boolean
  createdAt?: string
}

type GroupMember = {
  name: string
  phone: string
  initials: string
  whatsappRole?: string
  linkedUserId?: string
  portalRole?: string
}


const PAGE_SIZE = 10
const ROLES = ["admin", "manager", "member", "guest"] as const

function roleBadgeClass(role?: string) {
  switch (role) {
    case "admin": return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    case "manager": return "border-blue-400/30 bg-blue-500/10 text-blue-300"
    case "guest": return "border-slate-600 bg-slate-800/50 text-slate-400"
    default: return "border-slate-600 bg-slate-800/50 text-slate-300"
  }
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "—"

  const diff =
    Date.now() -
    new Date(dateStr).getTime()

  const mins = Math.floor(diff / 60000)

  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)

  if (hrs < 24) return `${hrs}h ago`

  return `${Math.floor(hrs / 24)}d ago`
}

export function MembersTab({
  users,
  tasks,
  members,
  groupId,
  currentUserRole,
}: {
  users: User[]
  tasks: Task[]
  members: GroupMember[]
  groupId: string
  currentUserRole: string
}) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const [selectedMember, setSelectedMember] =
  React.useState<any>(null)

const [selectedUser, setSelectedUser] =
  React.useState("")

const [selectedRole, setSelectedRole] =
  React.useState("member")

  const [removeMember, setRemoveMember] =
  React.useState<any>(null)

  const [profileMember, setProfileMember] =
  React.useState<any>(null)

  const [open, setOpen] =
  React.useState(false)

      const isAdmin =
  currentUserRole === "admin"

  const taskStats = React.useMemo(() => {
    const map: Record<string, { total: number; completed: number; pending: number }> = {}
    tasks.forEach((t) => {
      const key = t.assignedTo?.toLowerCase().trim()
      if (!key) return
      if (!map[key]) map[key] = { total: 0, completed: 0, pending: 0 }
      map[key].total++
      if (t.status === "completed") map[key].completed++
      if (t.status === "pending") map[key].pending++
    })

    return map
  }, [tasks])

  const memberRows = React.useMemo(() => {
  return (members || []).map((member) => {
    const key = member.name?.toLowerCase().trim()

    const stats =
      (key && taskStats[key]) || {
        total: 0,
        completed: 0,
        pending: 0,
      }

    const matchedUser = users.find(
  (u) =>
    u._id === member.linkedUserId
)

    return {
      ...member,
      ...stats,

      whatsappRole: member.whatsappRole,

      userId: matchedUser?._id,
      role:
  matchedUser?.role ||
  member.portalRole,
      email: matchedUser?.email,
      isVerified: !!matchedUser,
      createdAt: matchedUser?.createdAt,
    }
  })
}, [members, users, taskStats])

  const filtered = React.useMemo(() => {
  const q = search.trim().toLowerCase()

  return memberRows.filter(
    (m) =>
      !q ||
      m.phone.toLowerCase().includes(q)
  )
}, [memberRows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const colors = ["bg-violet-600", "bg-emerald-600", "bg-blue-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600"]

  async function handleRoleChange(userId: string, role: string) {
    setUpdatingId(userId)
    try {
      const res = await fetch("/api/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to update role")
        return
      }
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Failed to update role")
    } finally {
      setUpdatingId(null)
    }
  }

  async function linkMember() {
  if (!selectedMember || !selectedUser) return

  await fetch(
    "/api/groups/link-member",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
  userId: selectedUser,
  role: selectedRole,
}),
    }
  )

  window.location.reload()
}

async function removeAccess() {
  if (!removeMember) return

  try {
    const res = await fetch(
      "/api/groups/remove-access",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          phone: removeMember.phone,
        }),
      }
    )

    if (!res.ok) {
      toast.error("Failed to remove access")
      return
    }

    toast.success("Portal access removed")

    window.location.reload()
  } catch {
    toast.error("Failed to remove access")
  }
}

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-2">
        <div className="relative w-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search members..."
            className="h-9 pl-9 border-slate-700 bg-slate-900/50 text-sm text-white placeholder:text-slate-500" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/60 hover:bg-slate-900/60">
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pl-5">Member</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Phone</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Access</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400">Role</TableHead>
              <TableHead className="text-[11px] uppercase tracking-widest text-slate-400 pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? paginated.map((member, idx) => (
<TableRow
  key={member.phone}
  className="border-slate-800 hover:bg-slate-900/40"
>
  {/* MEMBER */}
  <TableCell className="pl-5 py-4">
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
          colors[idx % colors.length]
        )}
      >
        {member.initials || "?"}
      </div>

      <div>
        <p className="text-sm font-medium text-white">
          {member.userId
            ? member.email?.split("@")[0]
            : member.phone}
        </p>
      </div>
    </div>
  </TableCell>

  {/* PHONE */}
  <TableCell className="text-slate-300">
    +{member.phone}
  </TableCell>

  {/* ACCESS */}
  <TableCell>
    <Badge
      variant="outline"
      className={
        member.userId
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
          : "border-blue-400/30 bg-blue-500/10 text-blue-300"
      }
    >
      {member.userId
        ? "MindMe User"
        : "WhatsApp Member"}
    </Badge>
  </TableCell>

  {/* ROLE */}
<TableCell className="py-4">
  <div className="flex flex-col gap-1">
    <Badge
      variant="outline"
      className="text-[11px] capitalize border-sky-500/30 bg-sky-500/10 text-sky-300"
    >
      {member.whatsappRole || "member"}
    </Badge>

    {member.userId && (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] capitalize",
          roleBadgeClass(member.role)
        )}
      >
        Portal: {member.role}
      </Badge>
    )}
  </div>
</TableCell>

  {/* ACTIONS */}
  <TableCell className="pr-5">
    {member.userId && isAdmin ? (
  <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0 text-slate-400 hover:text-white"
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
  align="end"
  className="border-slate-700 bg-slate-900 text-slate-200"
>
 <DropdownMenuItem
  onClick={() => {
    setProfileMember(member)
  }}
>
  View Profile
</DropdownMenuItem>

<DropdownMenuItem
  disabled={member.role === "admin"}
  onClick={() => {
    if (!member.userId) return
    handleRoleChange(member.userId, "admin")
  }}
>
  Change to Admin
</DropdownMenuItem>

<DropdownMenuItem
  disabled={member.role === "manager"}
  onClick={() => {
    if (!member.userId) return
    handleRoleChange(member.userId, "manager")
  }}
>
  Change to Manager
</DropdownMenuItem>

<DropdownMenuItem
  disabled={member.role === "member"}
  onClick={() => {
    if (!member.userId) return
    handleRoleChange(member.userId, "member")
  }}
>
  Change to Member
</DropdownMenuItem>

<DropdownMenuItem
  disabled={member.role === "guest"}
  onClick={() => {
    if (!member.userId) return
    handleRoleChange(member.userId, "guest")
  }}
>
  Change to Guest
</DropdownMenuItem>

  <DropdownMenuItem
    className="text-red-400"
    onClick={() => {
      setRemoveMember(member)
    }}
  >
    Remove Access
  </DropdownMenuItem>
</DropdownMenuContent>
      </DropdownMenu>
      
      ) : member.userId ? (
  <Badge
    variant="outline"
    className="text-xs"
  >
    View Only
  </Badge>
    ) : (
      isAdmin ? (
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      setSelectedMember(member)
      setOpen(true)
    }}
  >
    Grant Access
  </Button>
) : (
  <span className="text-xs text-slate-500">
    No Access
  </span>
)
    )}
  </TableCell>
</TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-sm text-slate-400">
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing 1 to {paginated.length} of {filtered.length} members</span>
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

      <Dialog
  open={!!selectedMember}
  onOpenChange={() => {
    setSelectedMember(null)
  }}
>
  <DialogContent className="bg-slate-950 border-slate-800">
    <DialogHeader>
      <DialogTitle>
        Grant Portal Access
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400">
          Phone
        </p>

        <p className="font-medium">
          +{selectedMember?.phone}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm text-slate-400">
          Select User
        </p>

        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 p-2"
          value={selectedUser}
          onChange={(e) =>
            setSelectedUser(e.target.value)
          }
        >
          <option value="">
            Select User
          </option>

          {users.map((user) => (
            <option
              key={user._id}
              value={user._id}
            >
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-sm text-slate-400">
          Portal Role
        </p>

        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 p-2"
          value={selectedRole}
          onChange={(e) =>
            setSelectedRole(e.target.value)
          }
        >
          {ROLES.map((role) => (
            <option
              key={role}
              value={role}
            >
              {role}
            </option>
          ))}
        </select>
      </div>

      <Button
        className="w-full"
        onClick={linkMember}
      >
        Link Member
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog
  open={open}
  onOpenChange={setOpen}
>
  <DialogContent className="border-slate-800 bg-slate-950 text-white">
    <DialogHeader>
      <DialogTitle>
        Grant Portal Access
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400 mb-2">
          WhatsApp Member
        </p>

        <div className="rounded-lg border border-slate-800 p-3">
          {selectedMember?.phone}
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-400 mb-2">
          Select MindMe User
        </p>

        <Select
          value={selectedUser}
          onValueChange={setSelectedUser}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose user" />
          </SelectTrigger>

          <SelectContent>
            {users.map((user) => (
              <SelectItem
                key={user._id}
                value={user._id}
              >
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-sm text-slate-400 mb-2">
          Portal Role
        </p>

        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="admin">
              Admin
            </SelectItem>

            <SelectItem value="manager">
              Manager
            </SelectItem>

            <SelectItem value="member">
              Member
            </SelectItem>

            <SelectItem value="guest">
              Guest
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        onClick={linkMember}
      >
        Link Member
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog
  open={!!profileMember}
  onOpenChange={() =>
    setProfileMember(null)
  }
>
  <DialogContent className="border-slate-800 bg-slate-950 text-white">
    <DialogHeader>
      <DialogTitle>
        Member Profile
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">

      <div>
        <p className="text-xs text-slate-500">
          Name
        </p>
        <p>
          {profileMember?.email?.split("@")[0] ||
            profileMember?.phone}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">
          Email
        </p>
        <p>
          {profileMember?.email || "Not linked"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">
          Phone
        </p>
        <p>
          +{profileMember?.phone}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">
          WhatsApp Role
        </p>
        <p>
          {profileMember?.whatsappRole ||
            "member"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">
          Portal Role
        </p>
        <p>
          {profileMember?.role ||
            "No Portal Access"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-500">
          Account Status
        </p>
        <p>
          {profileMember?.userId
            ? "Linked User"
            : "WhatsApp Only"}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            setProfileMember(null)
          }
        >
          Close
        </Button>
      </div>

    </div>
  </DialogContent>
</Dialog>

    </div>
  )
}