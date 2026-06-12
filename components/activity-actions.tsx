"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

export default function ActivityActions({
  taskId,
}: {
  taskId: string
}) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [snoozeType, setSnoozeType] = useState("2hours")
  const [customDate, setCustomDate] = useState("")

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
    if (snoozeType === "custom" && !customDate) {
      alert("Please select a date")
      return
    }

    let snoozeUntil = ""

    if (snoozeType === "2hours") {
      snoozeUntil = new Date(
        Date.now() + 2 * 60 * 60 * 1000
      ).toISOString()
    }

    if (snoozeType === "24hours") {
      snoozeUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString()
    }

    if (snoozeType === "custom") {
      snoozeUntil = new Date(customDate).toISOString()
    }

    const res = await fetch("/api/tasks/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        status: "snoozed",
        snoozeUntil,
      }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
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
          onClick={() => setOpen(true)}
        >
          Snooze
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
  <DialogTitle>Snooze Task</DialogTitle>

  <DialogDescription>
    Choose when this task should reappear.
  </DialogDescription>
</DialogHeader>

          <RadioGroup
            value={snoozeType}
            onValueChange={setSnoozeType}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2hours" id="2hours" />
              <label htmlFor="2hours">2 Hours</label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem value="24hours" id="24hours" />
              <label htmlFor="24hours">Tomorrow</label>
            </div>

            <div className="flex items-center gap-2">
              <RadioGroupItem value="custom" id="custom" />
              <label htmlFor="custom">Custom Date</label>
            </div>
          </RadioGroup>

          {snoozeType === "custom" && (
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full rounded-md border p-2"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleSnooze}>
              Snooze
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}