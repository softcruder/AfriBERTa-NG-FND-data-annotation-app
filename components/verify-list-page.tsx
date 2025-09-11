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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Verification</CardTitle>
          <CardDescription>Review and verify completed annotations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <div className="text-muted-foreground">No items pending verification.</div>
          ) : (
            items.map((item: any) => (
              <div key={item.rowId} className="p-3 border rounded-lg flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.claimText}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Badge variant="outline">{item.annotatorId}</Badge>
                    <span>Status: {item.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Link href={`/dashboard/annotator/verify/${encodeURIComponent(item.rowId)}`}>Verify Details</Link>
                  </Button>
                  {user?.role === "admin" && (
                    <Button
                      size="sm"
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
            ))
          )}
          {!isLoading && data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
