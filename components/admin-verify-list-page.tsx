"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useAuth } from "@/custom-hooks"
import { usePaginatedAnnotations } from "@/custom-hooks/usePaginatedAnnotations"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminVerifyListPage() {
  const { spreadsheetId } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isLoading } = usePaginatedAnnotations(spreadsheetId, page, pageSize)

  const [filter, setFilter] = useState<"all" | "qa-approved" | "admin-review" | "unverified">("all")

  const items = useMemo(() => {
    const base = (data?.items || []).filter(
      (a: any) =>
        a.status === "qa-approved" || a.status === "admin-review" || (a.status === "completed" && !a.verifiedBy),
    )
    if (filter === "all") return base
    if (filter === "qa-approved") return base.filter((a: any) => a.status === "qa-approved")
    if (filter === "admin-review") return base.filter((a: any) => a.status === "admin-review")
    // unverified = completed without verifiedBy
    return base.filter((a: any) => a.status === "completed" && !a.verifiedBy)
  }, [data, filter])

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Verification</CardTitle>
          <CardDescription>Review QA-approved or flagged items and finalize verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Button
              type="button"
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="h-7"
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "qa-approved" ? "default" : "outline"}
              onClick={() => setFilter("qa-approved")}
              className="h-7"
            >
              QA Approved
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "admin-review" ? "default" : "outline"}
              onClick={() => setFilter("admin-review")}
              className="h-7"
            >
              Needs Admin Review
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === "unverified" ? "default" : "outline"}
              onClick={() => setFilter("unverified")}
              className="h-7"
            >
              Unverified
            </Button>
          </div>

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
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">No items pending admin verification.</div>
          ) : (
            items.map((item: any) => (
              <div key={item.rowId} className="p-3 border rounded-lg flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.claimText}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Badge variant="outline">{item.annotatorId}</Badge>
                    <Badge
                      variant={
                        item.status === "qa-approved"
                          ? "default"
                          : item.status === "admin-review"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {item.status === "completed" && !item.verifiedBy ? "unverified" : item.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/admin/verify/${encodeURIComponent(item.rowId)}`}>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </Link>
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
