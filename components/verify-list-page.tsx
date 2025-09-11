"use client"

import Link from "next/link"
import React from "react"
import { useAuth } from "@/custom-hooks"
import { usePaginatedAnnotations } from "@/custom-hooks/usePaginatedAnnotations"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export function VerifyListPage() {
  const { spreadsheetId, user } = useAuth()
  const [page, setPage] = React.useState(1)
  const pageSize = 20
  const { data, isLoading, mutate } = usePaginatedAnnotations(spreadsheetId, page, pageSize)
  const { verify, loading } = useVerifyAnnotation()
  const { toast } = useToast()

  const items = (data?.items || [])
    .filter((a: any) => !a.verifiedBy && a.status !== "verified")
    .filter((a: any) => {
      if (user?.role === "admin") return true
      // Non-admins should not see admin-review or invalid items
      if (a.status === "admin-review" || a.status === "invalid") return false
      return true
    })

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl">Pending Verification</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Review and verify completed annotations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-lg flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground text-sm">No items pending verification.</div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {items.map((item: any) => (
                <div
                  key={item.rowId}
                  className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-card/30 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <div className="font-medium truncate" title={item.claimText}>
                      {item.claimText}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="truncate max-w-[8rem]" title={item.annotatorId}>
                        {item.annotatorId}
                      </Badge>
                      <span className="truncate">Status: {item.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-initial">
                      <Link href={`/dashboard/annotator/verify/${encodeURIComponent(item.rowId)}`}>Verify Details</Link>
                    </Button>
                    {user?.role === "admin" && (
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-initial"
                        isLoading={loading}
                        onClick={async () => {
                          try {
                            if (!spreadsheetId) return
                            const res = await verify({ spreadsheetId, rowId: item.rowId })
                            if ((res as any)?.success !== false) {
                              await mutate()
                              toast({ title: "Verified", description: "Annotation marked as verified." })
                            }
                          } catch {}
                        }}
                        disabled={false}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && data && data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex w-full sm:w-auto justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex-1 sm:flex-initial"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  className="flex-1 sm:flex-initial"
                >
                  Next
                </Button>
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
