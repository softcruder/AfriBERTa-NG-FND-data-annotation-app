"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react"
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
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Available Tasks</CardTitle>
            <CardDescription className="mt-0.5">
              Showing {tasks.length} of {total} rows
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={() => mutate()} className="shrink-0">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-xs sm:text-sm text-muted-foreground">{isLoading ? "Loading…" : ""}</div>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-card/30"
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
                    className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-card/30 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 w-full">
                      <div className="text-[11px] sm:text-xs text-muted-foreground mb-0.5">ID: {idCol || "(none)"}</div>
                      <div className="font-medium flex items-center gap-2 text-sm sm:text-base">
                        <span
                          className="max-w-[14rem] sm:max-w-[100%] line-clamp-1 sm:line-clamp-1"
                          title={t.data[1] || t.data[0] || "(empty)"}
                        >
                          {t.data[1] || t.data[0] || "(empty)"}
                        </span>
                        <Badge variant="outline" className="shrink-0 uppercase">
                          {lang}
                        </Badge>
                        {remaining && remaining.length > 0 && (
                          <span
                            className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[10rem]"
                            title={`Needs: ${remaining.join(", ")}`}
                          >
                            → needs: {remaining.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link className="w-full sm:w-auto" href={`${basePath}/annotate/${encodeURIComponent(rowId)}`}>
                      <Button size="sm" className="gap-2 w-full sm:w-auto" aria-label={`Start task ${rowId}`}>
                        <Play className="h-4 w-4" /> <span className="sm:inline">Start</span>
                      </Button>
                    </Link>
                  </div>
                )
              })}
            {!isLoading && tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks to show.</div>}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex w-full sm:w-auto justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-initial"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= Math.ceil(total / pageSize)}
                className="flex-1 sm:flex-initial"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Page {currentPage} of {Math.max(1, Math.ceil(total / pageSize))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
