"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ActivityActions({
  taskId,
}: {
  taskId: string
}) {

  const router = useRouter() // ✅ YAHAN

  const handleComplete = async () => {
    const res = await fetch("/api/tasks/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        status: "completed",
      }),
    })

    if (res.ok) {
      router.refresh()
    }
  }

  const handleSnooze = async () => {
    const res = await fetch("/api/tasks/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        status: "snoozed",
      }),
    })

    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2 sm:justify-end">
      <Button
        size="sm"
        className="h-7 rounded-full bg-emerald-500 px-3 text-xs text-black hover:bg-emerald-400"
        onClick={handleComplete}
      >
        Confirm Completed
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 rounded-full border-white/20 bg-white/5 px-3 text-xs text-zinc-100 hover:bg-white/10"
        onClick={handleSnooze}
      >
        Snooze
      </Button>
    </div>
  )
}