"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Clock, ArrowLeft, ExternalLink, Pause, Play, Save, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { setCurrentTask } from "@/lib/data-store"
import { useTimeTracking } from "@/hooks/use-time-tracking"
import { annotationFormSchema, type AnnotationFormData } from "@/lib/validation"
import { isDualTranslator } from "@/lib/payment-calculator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BaseAnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
  mode: "annotation" | "translation" | "qa"
  children: React.ReactNode
}

export function BaseAnnotationForm({ task, user, onComplete, onCancel, mode, children }: BaseAnnotationFormProps) {
  const [showOriginalDesktop, setShowOriginalDesktop] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [markAsInvalid, setMarkAsInvalid] = useState(false)
  const { toast } = useToast()

  const claimLanguage = (task.csvRow.data[4] || "").trim().toLowerCase()
  const needsTranslation = claimLanguage === "en"
  const isQAMode = mode === "qa"

  // Check if user is a dual translator
  const userIsDualTranslator = isDualTranslator(user.translationLanguages?.join(",") || "")

  // Parse source links
  const parseLinks = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap(item => parseLinks(item)).filter(Boolean)
    }
    if (typeof input === "string") {
      const s = input.trim()
      if (!s) return []

      // Try to parse as JSON array first
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const parsed = JSON.parse(s)
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item).trim()).filter(Boolean)
          }
        } catch {
          // If JSON parsing fails, continue with string splitting
        }
      }

      // Handle malformed JSON array strings like ["url1", "url2", ...]
      if (s.startsWith("[") && s.includes('"')) {
        try {
          // Extract URLs from malformed JSON array string
          const urlMatches = s.match(/https?:\/\/[^\s"]+/g)
          if (urlMatches) {
            return urlMatches.map(url => decodeURIComponent(url)).filter(Boolean)
          }
        } catch {
          // If extraction fails, continue with string splitting
        }
      }

      return s
        .split(/[;\n,]\s*/)
        .map(t => t.trim())
        .filter(Boolean)
    }
    return []
  }

  const parsedSourceLinks = parseLinks(task.sourceLinks as unknown)
  const initialSourceUrl = task.csvRow.data[7] || parsedSourceLinks[0] || ""
  const initialClaimLinksFromCSV = parseLinks(task.csvRow.data[5])
  const initialClaimLinks = parsedSourceLinks.length > 1 ? parsedSourceLinks.slice(1) : initialClaimLinksFromCSV
  const initialArticleBody = task.csvRow.data[9] || ""

  const form = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationFormSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      claims: task.claims.length > 0 ? task.claims : [task.csvRow.data[1] || "Default claim"],
      sourceUrl: initialSourceUrl,
      claimLinks: initialClaimLinks.length > 0 ? initialClaimLinks : [],
      articleBody: initialArticleBody,
      translation: task.translation || "",
      translationLanguage: task.translationLanguage,
      // Dual translation fields
      translationHausa: task.translationHausa || "",
      translationYoruba: task.translationYoruba || "",
      isDualTranslator: userIsDualTranslator,
      articleBodyHausa: task.articleBodyHausa || "",
      articleBodyYoruba: task.articleBodyYoruba || "",
      needsTranslation,
      verdict: (task.verdict as any) || undefined,
      isValid: task.isValid ?? true,
      invalidityReason: task.invalidityReason || "",
      isQAMode,
      qaComments: "",
    },
  })

  const {
    watch,
    setValue,
    getValues,
    handleSubmit,
    trigger,
    formState: { errors, isValid: formIsValid },
  } = form
  const watchedValues = watch()

  const timeTracking = useTimeTracking({
    idleThreshold: 15 * 60 * 1000,
    onIdle: () => {
      toast({
        title: "Session Timeout Warning",
        description: "You've been inactive for a while. Your session will timeout soon.",
        variant: "destructive",
      })
    },
    onTimeout: () => {
      handleAutoSave()
    },
  })

  // Start timer once on mount
  const startedRef = useRef(false)
  useEffect(() => {
    if (!startedRef.current) {
      timeTracking.start()
      startedRef.current = true
    }
  }, [timeTracking])

  // Update task in storage
  useEffect(() => {
    const currentFormData = getValues()
    const updatedTask: AnnotationTask = {
      ...task,
      claims: currentFormData.claims,
      sourceLinks: [currentFormData.sourceUrl, ...currentFormData.claimLinks].filter(Boolean),
      translation: currentFormData.translation,
      translationLanguage: currentFormData.translationLanguage,
      // Include dual translation fields
      translationHausa: currentFormData.translationHausa,
      translationYoruba: currentFormData.translationYoruba,
      articleBodyHausa: currentFormData.articleBodyHausa,
      articleBodyYoruba: currentFormData.articleBodyYoruba,
      verdict: currentFormData.verdict,
      isValid: currentFormData.isValid,
      invalidityReason: currentFormData.invalidityReason,
    }
    setCurrentTask(updatedTask)
  }, [watchedValues, getValues, task])

  // Update isValid when markAsInvalid changes
  useEffect(() => {
    setValue("isValid", !markAsInvalid)
    if (!markAsInvalid) {
      setValue("invalidityReason", "")
    }
    // Only trigger validation when toggling validity, not on every change
    setTimeout(() => trigger(), 100)
  }, [markAsInvalid, setValue, trigger])

  // Retrigger validation for fields that have errors when their values change
  useEffect(() => {
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      // Debounced validation for fields with errors
      const timeoutId = setTimeout(() => {
        errorFields.forEach(fieldName => {
          trigger(fieldName as any)
        })
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [watchedValues, errors, trigger])

  const handleAutoSave = async () => {
    try {
      const formData = getValues()
      const progressData = {
        ...task,
        ...formData,
        timeSpent: timeTracking.getTotalMinutes(),
        lastSaved: new Date().toISOString(),
        autoSaved: true,
      }
      localStorage.setItem(`annotation_progress_${task.id}`, JSON.stringify(progressData))
      toast({
        title: "Progress Saved",
        description: "Your work has been automatically saved.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to auto-save progress. Please save manually.",
        variant: "destructive",
      })
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    // Trigger validation to ensure form state is current
    const isFormValid = await trigger()
    if (isFormValid) {
      handleSubmit(onSubmit)(e)
    } else {
      e.preventDefault()
      // Scroll to first error if needed
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        element?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const onSubmit = (data: AnnotationFormData) => {
    if (submitting) return

    // Prevent self-verification in QA mode
    if (isQAMode && task.annotatorId === user.id) {
      toast({
        title: "Self-verification Not Allowed",
        description: "You cannot perform QA on your own annotation. Please assign this task to another annotator.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    timeTracking.stop()

    // Handle translation logic for dual translators
    let finalTranslation = data.translation
    let finalTranslationLanguage = data.translationLanguage
    let finalClaims = data.claims

    if (needsTranslation && data.isDualTranslator) {
      // For dual translators, use both translations combined
      finalTranslation = `Hausa: ${data.translationHausa || ""}\nYoruba: ${data.translationYoruba || ""}`
      finalTranslationLanguage = "ha" // Set a default, but we have both
      // Update claims to reflect both translations
      finalClaims = [data.translationHausa || "", data.translationYoruba || ""].filter(Boolean)
    } else if (needsTranslation && data.translation) {
      finalClaims = [data.translation]
    }

    const completedTask: AnnotationTask = {
      ...task,
      claims: finalClaims,
      sourceLinks: [data.sourceUrl, ...data.claimLinks].filter(Boolean),
      translation: finalTranslation,
      translationLanguage: finalTranslationLanguage,
      // Include dual translation fields
      translationHausa: data.translationHausa,
      translationYoruba: data.translationYoruba,
      articleBodyHausa: data.articleBodyHausa,
      articleBodyYoruba: data.articleBodyYoruba,
      articleBody: data.articleBody,
      sourceUrl: data.sourceUrl,
      claimLinks: data.claimLinks,
      verdict: data.verdict,
      isValid: data.isValid,
      invalidityReason: data.invalidityReason,
      startTime: task.startTime,
      endTime: new Date(),
      status: data.isValid ? "completed" : "qa-pending",
      annotatorId: user.id,
      // Include additional CSV fields for export
      csvData: {
        originalClaim: task.csvRow.data[1] || "",
        language: task.csvRow.data[4] || "",
        originalSourceUrl: task.csvRow.data[7] || "",
        domain: task.csvRow.data[6] || task.csvRow.data[8] || "", // Try different columns for domain
        id_in_source: task.csvRow.data[0] || "",
      },
    }

    localStorage.removeItem(`annotation_progress_${task.id}`)
    Promise.resolve(onComplete(completedTask)).finally(() => setSubmitting(false))
  }

  const handleCancel = () => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this task? Your progress will be lost.")
    if (confirmCancel) {
      timeTracking.stop()
      localStorage.removeItem(`annotation_progress_${task.id}`)
      toast({
        title: "Task Cancelled",
        description: "Your annotation task has been cancelled.",
        variant: "default",
      })
      onCancel()
    }
  }

  const handlePauseResume = () => {
    if (timeTracking.isActive) {
      timeTracking.pause()
      handleAutoSave()
    } else {
      timeTracking.resume()
    }
  }

  const getModeTitle = () => {
    switch (mode) {
      case "translation":
        return "Translation & Annotation"
      case "qa":
        return "Quality Assurance Review"
      default:
        return "Annotation Task"
    }
  }

  const getPaymentInfo = () => {
    switch (mode) {
      case "translation":
        const translationLanguagesStr = user.translationLanguages?.join(",") || ""
        const isDual = isDualTranslator(translationLanguagesStr)
        if (isDual) {
          return "Dual Translation: NGN80 + Annotation: NGN100"
        } else {
          return "Translation: NGN70 + Annotation: NGN100"
        }
      case "qa":
        return "QA Review: NGN20"
      default:
        return "Annotation: NGN100"
    }
  }

  // Debug form validation state (minimal logging)
  // if (!formIsValid && Object.keys(errors).length > 0) {
  //   console.log("Form validation errors:", errors)
  // }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-6 max-w-6xl">
          {/* Header */}
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Top Row: Title, User & Time */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {getModeTitle()}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    Row ID: <span className="font-medium">{task.rowId}</span>
                  </p>
                  <Badge variant="outline" className="text-xs w-fit">
                    {getPaymentInfo()}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Time Tracking */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <Badge variant={timeTracking.isIdle ? "destructive" : "secondary"} className="font-mono text-xs">
                    {timeTracking.formatTime()}
                    {timeTracking.isIdle && " (IDLE)"}
                  </Badge>
                </div>

                {/* User Avatar */}
                <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Go Back</span>
                <span className="sm:hidden">Back</span>
              </Button>

              {/* Mobile original data sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2">
                    <span className="hidden sm:inline">Original Data</span>
                    <span className="sm:hidden">Data</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="lg:hidden">
                  <SheetHeader>
                    <SheetTitle>Original Data</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 max-h-[60vh] overflow-auto pr-2">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Extracted Claim Text</Label>
                        <div className="mt-1 text-sm whitespace-pre-wrap">{task.csvRow.data[1] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Language</Label>
                        <div className="mt-1 text-sm">{task.csvRow.data[4] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Source URL</Label>
                        <div className="mt-1 break-all text-sm">{task.csvRow.data[7] || "(empty)"}</div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="sm" onClick={handlePauseResume} className="gap-2">
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

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Status indicator for mobile */}
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
              {/* Original Data Sidebar */}
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
                      onClick={() => setShowOriginalDesktop(v => !v)}
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

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Stats</Label>
                        <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Active Time:</span>
                            <span className="font-mono text-sm font-medium">{timeTracking.formatTime()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                            <Badge variant={timeTracking.isActive ? "default" : "secondary"} className="text-xs">
                              {timeTracking.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Main Form Content */}
              <div>
                <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{getModeTitle()}</CardTitle>
                    <CardDescription>
                      {mode === "qa" ? "Review and verify the annotation" : "Edit and annotate the claim data"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    {/* Task Validity Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                          Task Validity
                        </Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Valid</span>
                          <Switch checked={markAsInvalid} onCheckedChange={setMarkAsInvalid} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Not Valid</span>
                        </div>
                      </div>

                      {markAsInvalid && (
                        <div className="space-y-2">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Please provide a detailed reason for marking this task as not valid. This will be reviewed
                              by QA and admin teams.
                            </AlertDescription>
                          </Alert>
                          <Textarea
                            placeholder="Explain why this task is not valid..."
                            value={watchedValues.invalidityReason || ""}
                            onChange={e => setValue("invalidityReason", e.target.value)}
                            className="min-h-[80px]"
                          />
                          {errors.invalidityReason && (
                            <p className="text-sm text-red-600">{errors.invalidityReason.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Form content passed as children */}
                    {children}

                    <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex-1 relative">
                        <Button
                          type="submit"
                          className="w-full h-11 gap-2 bg-primary hover:bg-primary/90"
                          disabled={timeTracking.isIdle || submitting || (isQAMode && task.annotatorId === user.id)}
                          isLoading={submitting}
                        >
                          <Save className="h-4 w-4" />
                          {submitting ? "Submitting..." : "Complete & Submit"}
                        </Button>
                        {timeTracking.isIdle && (
                          <div className="absolute -top-8 left-0 right-0 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                            Resume activity to enable submission
                          </div>
                        )}
                        {isQAMode && task.annotatorId === user.id && (
                          <div className="absolute -top-8 left-0 right-0 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1">
                            Self-verification not allowed
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
