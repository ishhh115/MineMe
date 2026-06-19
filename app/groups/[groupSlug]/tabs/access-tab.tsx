"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Invite = {
  _id: string
  phone?: string
  role?: string
  status?: string
  sentAt?: string
}

export function AccessTab({
  invites = [],
}: {
  invites?: Invite[]
}) {
  const pendingInvites =
    invites.filter(
      (i) => i.status === "pending"
    )

  const acceptedInvites =
    invites.filter(
      (i) => i.status === "accepted"
    )

  const expiredInvites =
    invites.filter(
      (i) => i.status === "expired"
    )

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Access Management
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Invite users and manage group permissions.
          </p>
        </div>

        <Button>
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-300">
            Pending Invites
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {pendingInvites.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-300">
            Accepted Invites
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {acceptedInvites.length}
          </p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-red-300">
            Expired Invites
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {expiredInvites.length}
          </p>
        </div>

      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">

        <div className="border-b border-slate-800 px-4 py-3">
          <h3 className="font-medium text-white">
            Invite History
          </h3>
        </div>

        <div className="divide-y divide-slate-800">

          {invites.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No invites found
            </div>
          ) : (
            invites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-white">
                    +91 {invite.phone}
                  </p>

                  <p className="text-xs text-slate-500">
                    {invite.role}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <Badge
  variant="outline"
  className={
    invite.status === "pending"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : invite.status === "accepted"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : invite.status === "expired"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-slate-700 bg-slate-800/50 text-slate-400"
  }
>
  {invite.status}
</Badge>

                  <div className="flex gap-2">

  {invite.status === "pending" && (
    <>
      <Button
  size="sm"
  variant="outline"
  onClick={async () => {

    const res = await fetch(
      "/api/invites/resend",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          inviteId: invite._id,
        }),
      }
    )

    if (!res.ok) {
      toast.error(
        "Failed to resend invite"
      )
      return
    }

    toast.success(
      "Invite resent"
    )

    window.location.reload()
  }}
>
  Resend
</Button>

      <Button
  size="sm"
  variant="destructive"
  onClick={async () => {

    const res = await fetch(
      "/api/invites/cancel",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          inviteId: invite._id,
        }),
      }
    )

    if (!res.ok) {
      toast.error(
        "Failed to cancel invite"
      )
      return
    }

    toast.success(
      "Invite cancelled"
    )

    window.location.reload()
  }}
>
  Cancel
</Button>
    </>
  )}

  {(
  invite.status === "expired" ||
  invite.status === "revoked"
) && (
  <Button
    size="sm"
    variant="outline"
    onClick={async () => {

      const res = await fetch(
        "/api/invites/resend",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            inviteId: invite._id,
          }),
        }
      )

      if (!res.ok) {
        toast.error(
          "Failed to resend invite"
        )
        return
      }

      toast.success(
        "Invite resent"
      )

      window.location.reload()
    }}
  >
    Resend
  </Button>
  )}

</div>

                </div>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  )
}