"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useAuth, useAnnotations } from "@/custom-hooks"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface VerifyOnePageProps {
  id: string // rowId
}

export function VerifyOnePage({ id }: VerifyOnePageProps) {
  const { spreadsheetId } = useAuth()
  const { data: annotations, mutate, isLoading } = useAnnotations(spreadsheetId)
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

  const backHref = `/dashboard/${useAuth().user?.role === "admin" ? "admin" : "annotator"}/verify`

  if (isLoading)
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
      </div>
    )

  if (!item)
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
            <CardDescription>Annotation with the given id was not found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={backHref}>
              <Button variant="outline">Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Verify Annotation</CardTitle>
              <CardDescription>Row ID: {item.rowId}</CardDescription>
            </div>
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                Back to list
              </Button>
            </Link>
          </div>
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
          <Button onClick={handleVerify} isLoading={loading} disabled={item.status === "verified"}>
            {item.status === "verified" ? "Already Verified" : "Mark Verified"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
