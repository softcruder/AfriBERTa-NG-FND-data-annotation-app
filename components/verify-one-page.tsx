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

  const canAccessAnnotation = useMemo(() => {
    if (!item || !user) return false
    // If annotation is for admin-review, only admins can access it
    if (item.status === "admin-review" && user.role !== "admin") {
      return false
    }
    return true
  }, [item, user])

  const userTranslationLanguages = useMemo(() => {
    if (!user?.translationLanguages) return []
    return user.translationLanguages
  }, [user])

  const backHref = `/dashboard/${user?.role === "admin" ? "admin" : "annotator"}/verify`

  const handlePeerApprove = async (updates?: any, editingMode?: boolean) => {
    if (!spreadsheetId || !item) return
    setActionError(null)
    try {
      const res = await verify({
        spreadsheetId,
        rowId: item.rowId,
        ...(updates ? { contentUpdates: updates } : {}),
      } as any)
      if ((res as any)?.success) {
        toast({
          title: "Approved",
          description: editingMode ? "Edits saved and annotation approved." : "Annotation approved.",
        })
        await mutate()
        if (editingMode) {
          setIsEditing(false)
          setHasUnsavedChanges(false)
          setPendingUpdates({})
        }
      } else if ((res as any)?.error) {
        setActionError((res as any).error || "Approval failed")
      }
    } catch (err: any) {
      handleError(err, { fallback: "Failed to approve annotation" })
    }
  }

  const handleReject = async () => {
    if (!spreadsheetId || !item) return
    setActionError(null)
    try {
      // Escalate to admin by sending isApproved: false so backend sets status=admin-review
      const res = await verify({ spreadsheetId, rowId: item.rowId, isApproved: false } as any)
      if ((res as any)?.success) {
        toast({ title: "Escalated", description: "Annotation escalated to admin review." })
        await mutate()
        router.push(`/dashboard/${user?.role === "admin" ? "admin" : "annotator"}/verify`)
      } else if ((res as any)?.error) {
        setActionError((res as any).error || "Escalation failed")
      }
    } catch (err: any) {
      handleError(err, { fallback: "Failed to escalate annotation" })
    }
  }

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

  if (!canAccessAnnotation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This annotation is under admin review and can only be accessed by administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={backHref}>
              <Button variant="outline">Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                disabled={loading}
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Annotation Details</CardTitle>
              <CardDescription>Review the current annotation content and source information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source Information Section */}
              <div className="border-b pb-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Source Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {item.sourceUrl && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source URL</label>
                      <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md break-all">
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {item.sourceUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {item.sourceLinks && item.sourceLinks.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source Links</label>
                      <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                        {item.sourceLinks.map((link, index) => (
                          <div key={index} className="break-all">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {link}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {item.claimLinks && item.claimLinks.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Claim Links</label>
                    <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md">
                      {item.claimLinks.map((link, index) => (
                        <div key={index} className="break-all">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {link}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Claims Section */}
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Claims</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  {task.claims.join(", ") || "No claims"}
                </div>
              </div>

              {userTranslationLanguages.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Article Bodies (Your Languages)
                  </h4>
                  <div className="space-y-4">
                    {userTranslationLanguages.includes("ha") && item.article_body_ha && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Hausa Article Body
                        </label>
                        <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md max-h-40 overflow-y-auto">
                          {item.article_body_ha}
                        </div>
                      </div>
                    )}

                    {userTranslationLanguages.includes("yo") && item.article_body_yo && (
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Yoruba Article Body
                        </label>
                        <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md max-h-40 overflow-y-auto">
                          {item.article_body_yo}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Translation Section */}
              {task.translation && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Translation</h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    {task.translation}
                  </div>
                </div>
              )}

              {/* Verdict Section */}
              {(task as any).verdict && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Verdict</h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    {(task as any).verdict}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Dataset Information</h4>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Status</label>
                    <div className="text-slate-600 dark:text-slate-400">{item.status}</div>
                  </div>

                  {item.translationLanguage && (
                    <div>
                      <label className="font-medium text-slate-700 dark:text-slate-300">Translation Language</label>
                      <div className="text-slate-600 dark:text-slate-400">{item.translationLanguage}</div>
                    </div>
                  )}

                  {item.originalLanguage && (
                    <div>
                      <label className="font-medium text-slate-700 dark:text-slate-300">Original Language</label>
                      <div className="text-slate-600 dark:text-slate-400">{item.originalLanguage}</div>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-slate-700 dark:text-slate-300">Requires Translation</label>
                    <div className="text-slate-600 dark:text-slate-400">{item.requiresTranslation ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
