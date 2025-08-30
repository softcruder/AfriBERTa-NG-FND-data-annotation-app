"use client"

import Link from "next/link"
import { useAuth, useAnnotations } from "@/custom-hooks"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function VerifyListPage() {
  const { spreadsheetId } = useAuth()
  const { data: annotations, mutate, isLoading } = useAnnotations(spreadsheetId)
  const { verify, loading } = useVerifyAnnotation()
  const { toast } = useToast()

  const items = (annotations || []).filter((a: any) => !a.verifiedBy && a.status !== "verified")

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Verification</CardTitle>
          <CardDescription>Review and verify completed annotations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
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
                  <Link href={`/dashboard/annotator/verify/${encodeURIComponent(item.rowId)}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
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
                    disabled={loading}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
