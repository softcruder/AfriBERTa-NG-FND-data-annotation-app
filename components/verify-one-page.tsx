"use client"

import { useMemo } from "react"
import { useAuth, useAnnotations } from "@/custom-hooks"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface VerifyOnePageProps {
  id: string // rowId
}

export function VerifyOnePage({ id }: VerifyOnePageProps) {
  const { spreadsheetId } = useAuth()
  const { data: annotations, mutate } = useAnnotations(spreadsheetId)
  const { verify, loading } = useVerifyAnnotation()
  const { toast } = useToast()

  const item = useMemo(() => annotations.find((a: any) => a.rowId === id), [annotations, id])

  const handleVerify = async () => {
    try {
      if (!spreadsheetId) return
      const res = await verify({ spreadsheetId, rowId: id })
      if ((res as any)?.success !== false) {
        await mutate()
        toast({ title: "Verified", description: "Annotation marked as verified." })
      }
    } catch {}
  }

  if (!item)
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
            <CardDescription>Annotation with the given id was not found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Annotation</CardTitle>
          <CardDescription>Row ID: {item.rowId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Claim Text</div>
            <div className="font-medium whitespace-pre-wrap">{item.claimText}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Source Links</div>
            <div className="text-sm break-all">
              {(Array.isArray(item.sourceLinks) ? item.sourceLinks : []).map((l: string, i: number) => (
                <div key={i}>
                  <a href={l} target="_blank" rel="noreferrer" className="text-primary underline">
                    {l}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleVerify} disabled={loading || item.status === "verified"}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                Processing
              </span>
            ) : item.status === "verified" ? (
              "Already Verified"
            ) : (
              "Mark Verified"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
