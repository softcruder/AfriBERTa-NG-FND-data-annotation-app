"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/custom-hooks"
import { useTasks } from "@/custom-hooks/useTasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"

interface TasksListPageProps {
  basePath: string // e.g., "/dashboard/annotator" or "/dashboard/admin"
}

export function TasksListPage({ basePath }: TasksListPageProps) {
  const { csvFileId } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data: tasksResp } = useTasks({ page, pageSize, fileId: csvFileId || undefined })
  const tasks = tasksResp?.items ?? []
  const total = tasksResp?.total ?? 0

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>
            Showing {tasks.length} of {total} rows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {tasks.map(t => {
              const rowId = `${csvFileId}_row_${t.index}`
              return (
                <div key={t.index} className="p-3 border rounded-lg flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">Row #{t.index}</div>
                    <div className="font-medium truncate">{t.data[1] || t.data[0] || "(empty)"}</div>
                  </div>
                  <Link href={`${basePath}/annotate/${encodeURIComponent(rowId)}`}>
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" /> Start
                    </Button>
                  </Link>
                </div>
              )
            })}
            {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks to show.</div>}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <div className="text-sm">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
