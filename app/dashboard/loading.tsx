import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <Card className="glass-card border-white/10">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32 bg-white/10" />
          <Skeleton className="h-10 w-72 bg-white/10" />
          <Skeleton className="h-4 w-full max-w-lg bg-white/10" />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <Skeleton className="h-3 w-20 bg-white/10" />
              <Skeleton className="mt-3 h-10 w-16 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-28 bg-white/10" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card border-white/10 lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="mt-3 h-4 w-full bg-white/10" />
            <Skeleton className="mt-2 h-4 w-3/4 bg-white/10" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10">
          <CardContent className="p-6">
            <Skeleton className="mx-auto h-44 w-44 rounded-full bg-white/10" />
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/10">
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <Skeleton className="h-4 w-48 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-36 bg-white/10" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
