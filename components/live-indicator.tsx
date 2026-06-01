"use client"

import React from "react"

export default function LiveIndicator({ start = 32 }: { start?: number }) {
  const [secs, setSecs] = React.useState(start)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => s + 1)
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span>Last update: {secs}s ago</span>
    </div>
  )
}
