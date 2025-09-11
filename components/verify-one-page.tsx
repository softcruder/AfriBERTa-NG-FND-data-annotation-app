"use client"

import Link from "next/link"
import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAnnotations } from "@/custom-hooks"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { useAdminVerify } from "@/custom-hooks/useAdminVerify"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QAFormRouter } from "@/components/forms/qa-form-router"
import type { AnnotationTask } from "@/lib/data-store"
import type { AnnotationRow } from "@/lib/google-apis"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface VerifyOnePageProps {
  id: string // rowId
}

export function VerifyOnePage({ id }: VerifyOnePageProps) {
  const router = useRouter()
  const { spreadsheetId, user } = useAuth()
  const { data: annotations, mutate, isLoading } = useAnnotations(spreadsheetId)
  const { verify, loading } = useVerifyAnnotation()
  const { adminVerify } = useAdminVerify()
  const { toast } = useToast()

  const item: AnnotationRow | undefined = useMemo(
    () => annotations.find((a: AnnotationRow) => a.rowId === id),
    [annotations, id],
  )

  const [pendingUpdates, setPendingUpdates] = useState<any>({})

  const makeTask = useCallback((): AnnotationTask | null => {
    if (!item) return null
    // Build a safer, typed adapter. Some fields may not exist; fill neutrals.
    // Infer original language shown in the UI (csvRow.data[4]) conservatively.
    const hasHa = Boolean(item.claim_text_ha || item.article_body_ha)
    const hasYo = Boolean(item.claim_text_yo || item.article_body_yo)
    const inferredLang = hasHa || hasYo || item.translationLanguage ? "en" : ""

    // Prepare a minimal CSV-shape that downstream forms read from.
    // Keep indexes consistent with other forms: [1]=claim, [2]=verdict, [4]=language, [5]=claimLinks, [7]=sourceUrl
    const csvData: string[] = new Array(8).fill("")
    csvData[0] = item.rowId
    csvData[1] = item.claimText || ""
    csvData[2] = item.verdict || ""
    csvData[4] = inferredLang
    csvData[5] = (item.claimLinks || []).join("; ")
    csvData[7] = item.sourceUrl || ""

    // Map row status into the allowed AnnotationTask status union
    const taskStatus: AnnotationTask["status"] = (() => {
      switch (item.status) {
        case "in-progress":
        case "completed":
        case "qa-pending":
        case "qa-approved":
        case "admin-review":
          return item.status
        default:
          return "qa-pending"
      }
    })()

    return {
      id: item.rowId,
      rowId: item.rowId,
      annotatorId: item.annotatorId,
      status: taskStatus,
      csvRow: { id: item.rowId, originalIndex: -1, data: csvData, header: [] },
      // The annotation form expects certain arrays/strings
      claims: [item.claimText || ""],
      sourceLinks: item.sourceLinks ?? [],
      claimLinks: item.claimLinks || [],
      sourceUrl: item.sourceUrl || "",
      translation: item.translation || "",
      translationLanguage: item.translationLanguage,
      verdict: item.verdict || "",
      // Provide dual fields for QA editing
      translationHausa: item.claim_text_ha || "",
      translationYoruba: item.claim_text_yo || "",
      articleBodyHausa: item.article_body_ha || "",
      articleBodyYoruba: item.article_body_yo || "",
    }
  }, [item])

  const task = makeTask()

  const handlePeerApprove = async (updates?: any) => {
    if (!spreadsheetId) return
    try {
      const res = await verify({
        spreadsheetId,
        rowId: id,
        isApproved: true,
        contentUpdates: updates,
        qaComments: pendingUpdates.qaComments || undefined,
      } as any)
      if ((res as any)?.success) {
        setPendingUpdates({})
        await mutate()
        toast({ title: "QA Approved", description: "Annotation moved to QA-approved." })
      }
    } catch (e) {}
  }

  const handleAdminFinalize = async () => {
    if (!spreadsheetId) return
    try {
      const res = await verify({ spreadsheetId, rowId: id, adminFinalize: true } as any)
      if ((res as any)?.success) {
        await mutate()
        toast({ title: "Verified", description: "Annotation verified & added to dataset (if unique)." })
        router.push("/dashboard/admin/verify")
      }
    } catch (e) {}
  }

  const handleReject = async () => {
    if (!spreadsheetId) return
    try {
      if (user?.role === "admin") {
        await adminVerify({
          spreadsheetId,
          rowId: id,
          action: "needs-revision",
          comments: pendingUpdates.qaComments || "",
        })
        toast({ title: "Sent for revision", description: "Annotator will be notified to revise." })
      } else {
        await verify({
          spreadsheetId,
          rowId: id,
          isApproved: false,
          qaComments: pendingUpdates.qaComments || "",
        } as any)
        toast({ title: "Escalated to admin", description: "Annotation sent to admin review." })
      }
      setPendingUpdates({})
      await mutate()
    } catch (e) {}
  }

  const backHref = `/dashboard/${user?.role === "admin" ? "admin" : "annotator"}/verify`

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
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Verification</h1>
          <p className="text-sm text-muted-foreground">Row ID: {item.rowId}</p>
        </div>
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
      </div>

      {task && user && (
        <QAFormRouter
          task={task as any}
          user={user as any}
          onComplete={completed => {
            // Build a minimal diff of fields that can be edited in QA forms
            const diff: Record<string, any> = {}
            const fields = [
              "claims",
              "verdict",
              "claimLinks",
              "translationHausa",
              "translationYoruba",
              "articleBodyHausa",
              "articleBodyYoruba",
              "articleBody",
              "qaComments",
              "translationLanguage",
            ] as const
            fields.forEach(f => {
              const nv = (completed as any)[f]
              if (typeof nv === "undefined") return
              ;(diff as any)[f] = nv
            })
            setPendingUpdates(diff)
            // Save only; explicit Approve/Reject buttons control status transitions
          }}
          onCancel={() => window.history.back()}
        />
      )}

      <div className="flex gap-2 pt-2">
        {/* Reject button for both roles */}
        <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>
          Reject
        </Button>
        {/* Approve for annotators (peer QA) */}
        {user?.role !== "admin" && (item.status as any) !== "qa-approved" && (
          <Button variant="default" size="sm" onClick={() => handlePeerApprove(pendingUpdates)} isLoading={loading}>
            Submit QA Approval
          </Button>
        )}
        {/* Finalize for admin */}
        {user?.role === "admin" && (
          <Button
            variant="default"
            size="sm"
            onClick={handleAdminFinalize}
            disabled={item.status === "verified"}
            isLoading={loading}
          >
            {item.status === "verified" ? "Verified" : "Finalize & Verify"}
          </Button>
        )}
      </div>
    </div>
  )
}
