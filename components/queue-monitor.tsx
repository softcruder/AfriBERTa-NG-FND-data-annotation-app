"use client"
import useSWR from "swr"
import { useEffect } from "react"
import { Card } from "@/components/ui/card" // assuming Card exists; fallback to div if not

interface QueueMetricsEntry {
  spreadsheetId: string
  enqueuedAt: number
}
interface LastUpdateEntry {
  spreadsheetId: string
  updatedAt: number
}
interface QueueResponse {
  queueDepth: number
  queue: QueueMetricsEntry[]
  lastUpdates: LastUpdateEntry[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function relative(ts: number) {
  const diff = Date.now() - ts
  if (diff < 2000) return "just now"
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return secs + "s ago"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return mins + "m ago"
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + "h ago"
  const days = Math.floor(hrs / 24)
  return days + "d ago"
}

export function QueueMonitor() {
  const { data, error, mutate, isLoading } = useSWR<QueueResponse>("/api/admin/annotations/queue", fetcher, {
    refreshInterval: 5000,
  })

  useEffect(() => {
    // initial fetch
    mutate()
  }, [mutate])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Formula Queue</h2>
      {error && <div className="text-sm text-red-500">Failed to load queue metrics</div>}
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
      {data && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Queue Depth</div>
            <div className="text-sm font-mono">{data.queueDepth}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-2">Pending</div>
            {data.queue.length === 0 && <div className="text-xs text-muted-foreground">(empty)</div>}
            {data.queue.map(q => (
              <div
                key={q.spreadsheetId}
                className="flex items-center justify-between text-xs border-b py-1 last:border-0"
              >
                <span className="font-mono truncate max-w-[200px]" title={q.spreadsheetId}>
                  {q.spreadsheetId}
                </span>
                <span>{relative(q.enqueuedAt)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-4">Last Updates</div>
            {data.lastUpdates.length === 0 && <div className="text-xs text-muted-foreground">(none recorded)</div>}
            {data.lastUpdates
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .slice(0, 15)
              .map(u => (
                <div
                  key={u.spreadsheetId}
                  className="flex items-center justify-between text-xs border-b py-1 last:border-0"
                >
                  <span className="font-mono truncate max-w-[200px]" title={u.spreadsheetId}>
                    {u.spreadsheetId}
                  </span>
                  <span>{relative(u.updatedAt)}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
