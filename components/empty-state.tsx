import React from "react"

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/8 bg-slate-900/30 p-4 text-sm text-slate-300">
      <div className="h-9 w-9 rounded-md bg-slate-800/40 flex items-center justify-center text-xs font-medium text-slate-200">—</div>
      <div>
        <div className="font-medium text-slate-100">{title}</div>
        {description && <div className="mt-1 text-xs text-slate-300">{description}</div>}
      </div>
    </div>
  )
}

export default EmptyState
