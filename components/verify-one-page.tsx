"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAnnotations } from "@/custom-hooks"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { useAdminVerify } from "@/custom-hooks/useAdminVerify"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QAFormRouter } from "@/components/forms/qa-form-router"
import type { AnnotationRow } from "@/lib/google-apis"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { ErrorAlert } from "@/components/ui/error-alert"
import { AnnotationMapper } from "@/lib/annotation-mapper"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

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
  const { handleError } = useErrorHandler()
  const [actionError, setActionError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const item: AnnotationRow | undefined = useMemo(
    () => annotations.find((a: AnnotationRow) => a.rowId === id),
    [annotations, id],
  )

  const [pendingUpdates, setPendingUpdates] = useState<any>({})

  const task = useMemo(() => {
    if (!item) return null
    return AnnotationMapper.annotationRowToTask(item)
  }, [item])

  const handlePeerApprove = async (updates?: any, isAutoApproval = false) => {
    if (!spreadsheetId) return
    setActionError(null)
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
        setHasUnsavedChanges(false)
        await mutate()
        toast({
          title: isAutoApproval ? "Changes Saved & Approved" : "QA Approved",
          description: isAutoApproval
            ? "Your edits have been saved and the annotation approved."
            : "Annotation moved to QA-approved.",
        })
        router.push(`/dashboard/${user?.role === "admin" ? "admin" : "annotator"}/verify`)
      } else {
        throw new Error("Failed to approve annotation")
      }
    } catch (error) {
      const message = handleError(error, { context: "peerApprove", rowId: id })
      setActionError("Failed to approve annotation. Please try again.")
    }
  }

  const handleAdminFinalize = async () => {
    if (!spreadsheetId) return
    setActionError(null)
    try {
      const res = await verify({ spreadsheetId, rowId: id, adminFinalize: true } as any)
      if ((res as any)?.success) {
        await mutate()
        toast({ title: "Verified", description: "Annotation verified & added to dataset (if unique)." })
        router.push("/dashboard/admin/verify")
      } else {
        throw new Error("Failed to finalize annotation")
      }
    } catch (error) {
      handleError(error, { context: "adminFinalize", rowId: id })
      setActionError("Failed to finalize annotation. Please try again.")
    }
  }

  const handleReject = async () => {
    if (!spreadsheetId) return
    setActionError(null)
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
      setHasUnsavedChanges(false)
      await mutate()
      router.push(`/dashboard/${user?.role === "admin" ? "admin" : "annotator"}/verify`)
    } catch (error) {
      handleError(error, { context: "reject", rowId: id })
      setActionError("Failed to reject annotation. Please try again.")
    }
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quality Assurance Review</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Row ID: {item?.rowId}</p>
        </div>
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            Back to List
          </Button>
        </Link>
      </div>

      {actionError && (
        <ErrorAlert message={actionError} onDismiss={() => setActionError(null)} onRetry={() => setActionError(null)} />
      )}

      {!isEditing && (
        <Card className="border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Review Actions
            </CardTitle>
            <CardDescription>
              Choose how to proceed with this annotation. You can approve as-is, make edits, or reject it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handlePeerApprove()}
                disabled={loading}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="h-4 w-4" />
                Approve As-Is
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="lg"
                className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                Edit & Review
              </Button>
              <Button onClick={handleReject} disabled={loading} variant="destructive" size="lg" className="gap-2">
                <XCircle className="h-4 w-4" />
                {user?.role === "admin" ? "Send for Revision" : "Escalate to Admin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && task && user && (
        <QAFormRouter
          task={task as any}
          user={user as any}
          onComplete={completed => {
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
            setHasUnsavedChanges(true)
            handlePeerApprove(diff, true)
          }}
          onCancel={() => {
            if (hasUnsavedChanges && !confirm("You have unsaved changes. Are you sure you want to cancel?")) {
              return
            }
            setIsEditing(false)
            setHasUnsavedChanges(false)
            setPendingUpdates({})
          }}
        />
      )}

      {!isEditing && task && (
        <Card>
          <CardHeader>
            <CardTitle>Annotation Details</CardTitle>
            <CardDescription>Review the current annotation content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Claims</h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                {task.claims.join(", ") || "No claims"}
              </div>
            </div>

            {task.translation && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Translation</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  {task.translation}
                </div>
              </div>
            )}

            {(task as any).verdict && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Verdict</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  {(task as any).verdict}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
