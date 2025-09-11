"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/custom-hooks"
import { Badge } from "@/components/ui/badge"
import { useTasks } from "@/custom-hooks/useTasks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface TasksListPageProps {
  basePath: string // e.g., "/dashboard/annotator" or "/dashboard/admin"
}

export function TasksListPage({ basePath }: TasksListPageProps) {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const page = search.get("page") ? parseInt(search.get("page") as string, 10) : 1

  const { csvFileId } = useAuth()

  const [currentPage, setCurrentPage] = useState<number>(page)
  const pageSize = 10
  const {
    data: tasksResp,
    isLoading,
    mutate,
  } = useTasks({ page: currentPage, pageSize, fileId: csvFileId || undefined })
  const tasksRaw = tasksResp?.items ?? []
  const total = tasksResp?.total ?? 0

  // If redirected here after a save with ?refresh=1, trigger a refetch once
  useEffect(() => {
    const shouldRefresh = search?.get("refresh") === "1"
    if (shouldRefresh) {
      mutate()
    }
  }, [mutate, search])

  // Function to update URL with new page number
  const updatePageInURL = (newPage: number) => {
    const params = new URLSearchParams(search.toString())
    if (newPage === 1) {
      params.delete("page") // Remove page param for page 1
    } else {
      params.set("page", newPage.toString())
    }
    const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    router.push(newURL)
  }

  // Sync currentPage with URL when URL changes
  useEffect(() => {
    if (currentPage !== page) {
      setCurrentPage(page)
    }
  }, [currentPage, page])

  // Handle page navigation
  const handlePreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1)
    setCurrentPage(newPage)
    updatePageInURL(newPage)
  }

  const handleNextPage = () => {
    const newPage = currentPage + 1
    setCurrentPage(newPage)
    updatePageInURL(newPage)
  }

  // Trust server-side filtering; just display items
  const tasks = tasksRaw

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>
            Showing {tasks.length} of {total} rows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-sm text-muted-foreground">{isLoading ? "Loading…" : ""}</div>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Refresh
            </Button>
          </div>
          <div className="space-y-2">
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            )}
            {!isLoading &&
              tasks.map(t => {
                const idCol = (t.data?.[0] || "").trim()
                const rowId = idCol || `${csvFileId ?? ""}_${t.index}`
                const lang = (t.data?.[4] || "").trim().toLowerCase() || "unknown"
                const remaining = (t as any).targetsRemaining as string[] | undefined
                return (
                  <div
                    key={rowId}
                    className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground">ID: {idCol || "(none)"}</div>
                      <div className="font-medium truncate flex items-center gap-2">
                        <span className="truncate">{t.data[1] || t.data[0] || "(empty)"}</span>
                        <Badge variant="outline" className="shrink-0 uppercase">
                          {lang}
                        </Badge>
                        {remaining && remaining.length > 0 && (
                          <span className="text-xs text-muted-foreground">→ needs: {remaining.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <Link className="w-full sm:w-auto" href={`${basePath}/annotate/${encodeURIComponent(rowId)}`}>
                      <Button size="sm" className="gap-2 w-full sm:w-auto">
                        <Play className="h-4 w-4" /> Start
                      </Button>
                    </Link>
                  </div>
                )
              })}
            {!isLoading && tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks to show.</div>}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <div className="text-sm">
              Page {currentPage} of {Math.max(1, Math.ceil(total / pageSize))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= Math.ceil(total / pageSize)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
