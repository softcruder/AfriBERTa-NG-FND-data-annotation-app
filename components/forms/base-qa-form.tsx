"use client"

import type React from "react"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Clock, Pause, Play, Save } from "lucide-react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { setCurrentTask } from "@/lib/data-store"
import { useTimeTracking } from "@/hooks/use-time-tracking"
import { annotationFormSchema, type AnnotationFormData } from "@/lib/validation"

interface BaseQAFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
  children: React.ReactNode
}

export function BaseQAForm({ task, user, onComplete, onCancel, children }: BaseQAFormProps) {
  const [showOriginalDesktop, setShowOriginalDesktop] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  const form = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      claims: task.claims.length > 0 ? task.claims : [task.csvRow.data[1] || ""],
      sourceUrl: task.csvRow.data[7] || "",
      claimLinks: [],
      articleBody: task.csvRow.data[9] || "",
      translation: task.translation || "",
      translationLanguage: task.translationLanguage,
      translationHausa: (task as any).translationHausa || (task as any).claim_text_ha || "",
      translationYoruba: (task as any).translationYoruba || (task as any).claim_text_yo || "",
      articleBodyHausa: (task as any).articleBodyHausa || (task as any).article_body_ha || "",
      articleBodyYoruba: (task as any).articleBodyYoruba || (task as any).article_body_yo || "",
      needsTranslation: (task.csvRow.data[4] || "").trim().toLowerCase() === "en",
      verdict: (task as any).verdict || undefined,
      isValid: true,
      invalidityReason: "",
      isQAMode: true,
      qaComments: "",
    },
  })

  const {
    watch,
    setValue,
    getValues,
    handleSubmit,
    trigger,
    formState: { errors },
  } = form
  const values = watch()

  const timeTracking = useTimeTracking({
    idleThreshold: 15 * 60 * 1000,
    onIdle: () => {
      toast({
        title: "Session Timeout Warning",
        description: "You've been inactive for a while. Your session will timeout soon.",
        variant: "destructive",
      })
    },
  })

  const startedRef = useRef(false)
  useEffect(() => {
    if (!startedRef.current) {
      timeTracking.start()
      startedRef.current = true
    }
  }, [timeTracking])

  useEffect(() => {
    const current = getValues()
    const updated: AnnotationTask = {
      ...task,
      claims: current.claims,
      sourceLinks: [current.sourceUrl, ...current.claimLinks].filter(Boolean),
      translation: current.translation,
      translationLanguage: current.translationLanguage,
      translationHausa: current.translationHausa,
      translationYoruba: current.translationYoruba,
      articleBodyHausa: current.articleBodyHausa,
      articleBodyYoruba: current.articleBodyYoruba,
      verdict: current.verdict,
      qaComments: current.qaComments,
    }
    setCurrentTask(updated)
  }, [values, getValues, task])

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change") {
        setHasChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const handleFormSubmit = async (e: React.FormEvent) => {
    const ok = await trigger()
    if (ok) handleSubmit(onSubmit)(e)
    else {
      e.preventDefault()
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const onSubmit = (data: AnnotationFormData) => {
    if (submitting) return

    // QA: prevent self-verification from this screen
    if (task.annotatorId === user.id) {
      toast({
        title: "Self-verification Not Allowed",
        description: "You cannot perform QA on your own annotation.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    timeTracking.stop()

    const completed: AnnotationTask = {
      ...task,
      claims: data.claims,
      sourceLinks: [data.sourceUrl, ...data.claimLinks].filter(Boolean),
      translation: data.translation,
      translationLanguage: data.translationLanguage,
      translationHausa: data.translationHausa,
      translationYoruba: data.translationYoruba,
      articleBodyHausa: data.articleBodyHausa,
      articleBodyYoruba: data.articleBodyYoruba,
      articleBody: data.articleBody,
      sourceUrl: data.sourceUrl,
      claimLinks: data.claimLinks,
      verdict: data.verdict,
      qaComments: data.qaComments || "",
    }

    Promise.resolve(onComplete(completed)).finally(() => setSubmitting(false))
  }

  const handleCancel = () => {
    if (confirm("Cancel QA review?")) onCancel()
  }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  Quality Assurance Review
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    Row ID: <span className="font-medium">{task.rowId}</span>
                  </p>
                  <Badge variant="outline" className="text-xs w-fit">
                    QA Review: NGN20
                  </Badge>
                  {hasChanges && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <Badge variant={timeTracking.isIdle ? "destructive" : "secondary"} className="font-mono text-xs">
                    {timeTracking.formatTime()}
                    {timeTracking.isIdle && " (IDLE)"}
                  </Badge>
                </div>
                <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Go Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (timeTracking.isActive ? timeTracking.pause() : timeTracking.resume())}
                className="gap-2"
              >
                {timeTracking.isActive ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                )}
              </Button>
              <div className="flex-1"></div>
              <div className="sm:hidden">
                <Badge variant={timeTracking.isActive ? "default" : "secondary"} className="text-xs">
                  {timeTracking.isActive ? "Active" : "Paused"}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div
              className={`grid grid-cols-1 gap-6 ${showOriginalDesktop ? "lg:grid-cols-[18rem_1fr]" : "lg:grid-cols-[7rem_1fr]"}`}
            >
              <div className="hidden lg:block">
                <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    {showOriginalDesktop && (
                      <div>
                        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Original Data</CardTitle>
                        <CardDescription>Reference information from the CSV</CardDescription>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => setShowOriginalDesktop((v) => !v)}
                    >
                      {showOriginalDesktop ? "Hide" : "Show"}
                    </Button>
                  </CardHeader>
                  {showOriginalDesktop && (
                    <CardContent className="space-y-4 p-6">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Extracted Claim Text
                          </Label>
                          <div className="mt-1 text-sm whitespace-pre-wrap break-all">
                            {task.csvRow.data[1] || "(empty)"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</Label>
                          <div className="mt-1 text-sm break-all">{task.csvRow.data[4] || "(empty)"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source URL</Label>
                          <div className="mt-1 break-all text-sm">{task.csvRow.data[7] || "(empty)"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Article Body</Label>
                          <div className="mt-1 text-sm whitespace-pre-wrap break-all line-clamp-6">
                            {task.csvRow.data[9] || "(empty)"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              <div>
                <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                      Quality Assurance Review
                    </CardTitle>
                    <CardDescription>Review and verify the annotation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">QA Comments</Label>
                      <Textarea
                        placeholder="Add notes for admin or annotator..."
                        value={values.qaComments || ""}
                        onChange={(e) => setValue("qaComments", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    {children}

                    <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex-1 relative">
                        <Button
                          type="submit"
                          className="w-full h-11 gap-2 bg-green-600 hover:bg-green-700 text-white"
                          disabled={timeTracking.isIdle || submitting}
                          isLoading={submitting}
                        >
                          <Save className="h-4 w-4" />
                          {submitting ? "Saving & Approving..." : "Save Changes & Approve"}
                        </Button>
                        {timeTracking.isIdle && (
                          <div className="absolute -top-8 left-0 right-0 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                            Resume activity to enable submission
                          </div>
                        )}
                      </div>
                      <Button type="button" variant="outline" onClick={handleCancel} className="h-11 bg-transparent">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  )
}
