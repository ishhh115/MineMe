"use client"

export default function ActivityClient({
  activities,
}: {
  activities: any[]
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <h1 className="mb-6 text-2xl font-bold">
        Activity Feed
      </h1>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className="rounded-xl border p-4"
          >
            <p className="font-semibold">
              {activity.title}
            </p>

            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>

            <p className="text-xs text-muted-foreground mt-2">
              {new Date(
                activity.createdAt
              ).toLocaleString()}
            </p>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="rounded-xl border p-8 text-center">
            No activity yet
          </div>
        )}
      </div>
    </div>
  )
}