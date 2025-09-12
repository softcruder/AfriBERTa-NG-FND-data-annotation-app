"use client"
import { QueueMonitor } from "@/components/queue-monitor"
import { ForceRefreshSession } from "@/components/force-refresh-session"

export default function AdminQueuePage() {
  return (
    <div className="p-6 space-y-6">
      <ForceRefreshSession />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Queue & Formula Updates</h1>
        <p className="text-sm text-muted-foreground max-w-prose">
          Live visibility into the background formula update queue and last successful formula refresh times. Use this
          to diagnose performance or concurrency issues. Data auto-refreshes every 5s.
        </p>
      </div>
      <QueueMonitor />
    </div>
  )
}
