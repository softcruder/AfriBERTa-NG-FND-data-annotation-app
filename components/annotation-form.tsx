"use client"

import { useForm } from "react-hook-form"
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
import { Clock, Plus, X, Save, ArrowLeft, ExternalLink, Pause, Play, Edit3, FileText } from "lucide-react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { setCurrentTask } from "@/lib/data-store"
import { useTimeTracking } from "@/hooks/use-time-tracking"
import { annotationFormSchema, VerdictEnum, type AnnotationFormData } from "@/lib/validation"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface AnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
}

export function AnnotationForm({ task, user, onComplete, onCancel }: AnnotationFormProps) {
  const [canEditClaim, setCanEditClaim] = useState(false)
  const [canEditVerdict, setCanEditVerdict] = useState(false)
  const [extractedClaimText, setExtractedClaimText] = useState("")
  const { toast } = useToast()
  const [showOriginalDesktop, setShowOriginalDesktop] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Robustly parse links that may come as:
  // - array of strings
  // - single string
  // - stringified JSON array (e.g. "[\"a\",\"b\"]" or "['a','b']")
  // - delimited string using ; , or newlines
  const parseLinks = (input: unknown): string[] => {
    const parseJSONStringArray = (s: string): string[] => {
      try {
        const parsed = JSON.parse(s)
        return Array.isArray(parsed) ? parsed.map(x => String(x).trim()).filter(Boolean) : []
      } catch {
        // try single quotes -> double quotes
        try {
          const normalized = s.replace(/'/g, '"')
          const parsed = JSON.parse(normalized)
          return Array.isArray(parsed) ? parsed.map(x => String(x).trim()).filter(Boolean) : []
        } catch {
          return []
        }
      }
    }

    if (Array.isArray(input)) {
      return input.flatMap(item => parseLinks(item)).filter(Boolean)
    }
    if (typeof input === "string") {
      const s = input.trim()
      if (!s) return []
      if ((s.startsWith("[") && s.endsWith("]")) || /^\[.*\]$/.test(s)) {
        const fromJson = parseJSONStringArray(s)
        if (fromJson.length) return fromJson
      }
      return s
        .split(/[;\n,]\s*/)
        .map(t =>
          t
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1"),
        )
        .filter(Boolean)
    }
    return []
  }

  const claimLanguage = (task.csvRow.data[4] || "").trim().toLowerCase()
  const needsTranslation = claimLanguage === "en"
  // Parse potentially stringified sourceLinks and CSV claim links
  const parsedSourceLinks = parseLinks(task.sourceLinks as unknown)
  const initialSourceUrl = task.csvRow.data[7] || parsedSourceLinks[0] || ""
  const initialClaimLinksFromCSV = parseLinks(task.csvRow.data[5])
  const initialClaimLinks = parsedSourceLinks.length > 1 ? parsedSourceLinks.slice(1) : initialClaimLinksFromCSV
  const initialArticleBody = task.csvRow.data[9] || ""

  const form = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationFormSchema),
    mode: "onChange",
    defaultValues: {
      claims: task.claims.length > 0 ? task.claims : [""],
      sourceUrl: initialSourceUrl,
      claimLinks: initialClaimLinks.length > 0 ? initialClaimLinks : [],
      articleBody: initialArticleBody,
      translation: task.translation || "",
      translationLanguage: undefined,
      needsTranslation,
      verdict: (task.verdict as any) || undefined,
    },
  })

  const {
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, isValid },
  } = form
  const watchedValues = watch()

  const timeTracking = useTimeTracking({
    idleThreshold: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      toast({
        title: "Session Timeout Warning",
        description: "You've been inactive for a while. Your session will timeout soon.",
        variant: "destructive",
      })
    },
    onResume: () => {
      // User resumed activity, no need for toast dismissal as they auto-dismiss
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize editability and default claim based on CSV data
  useEffect(() => {
    const csvData = task.csvRow.data
    const ratingStatus = csvData[2] || ""
    const claimText = csvData[1] || csvData[0] || ""

    const isEditable = ratingStatus.toLowerCase() === "unrated" || ratingStatus === ""
    setCanEditClaim(isEditable)
    setCanEditVerdict(isEditable)
    setExtractedClaimText(claimText)

    if (isEditable && claimText) {
      setValue("claims", [claimText])
      toast({
        title: "Claim Editable",
        description: "This claim is unrated and can be edited. Make corrections as needed before proceeding.",
        variant: "default",
      })
    }
  }, [task.csvRow.data, setValue, toast])

  useEffect(() => {
    const currentFormData = getValues()
    const updatedTask: AnnotationTask = {
      ...task,
      claims: currentFormData.claims,
      // keep storage compatible: combine immutable sourceUrl with editable claimLinks
      sourceLinks: [currentFormData.sourceUrl, ...currentFormData.claimLinks].filter(Boolean),
      translation: currentFormData.translation,
      verdict: currentFormData.verdict,
    }
    setCurrentTask(updatedTask)
  }, [watchedValues, getValues, task])

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

  const addClaim = () => {
    const currentClaims = getValues("claims")
    setValue("claims", [...currentClaims, ""])
  }

  const updateClaim = (index: number, value: string) => {
    const currentClaims = getValues("claims")
    const updatedClaims = currentClaims.map((claim, i) => (i === index ? value : claim))
    setValue("claims", updatedClaims)
  }

  const removeClaim = (index: number) => {
    const currentClaims = getValues("claims")
    if (currentClaims.length > 1) {
      setValue(
        "claims",
        currentClaims.filter((_, i) => i !== index),
      )
    }
  }

  const addClaimLink = () => {
    const currentLinks = getValues("claimLinks")
    setValue("claimLinks", [...currentLinks, ""])
  }

  const updateClaimLink = (index: number, value: string) => {
    const currentLinks = getValues("claimLinks")
    const updatedLinks = currentLinks.map((link, i) => (i === index ? value : link))
    setValue("claimLinks", updatedLinks)
  }

  const removeClaimLink = (index: number) => {
    const currentLinks = getValues("claimLinks")
    setValue(
      "claimLinks",
      currentLinks.filter((_, i) => i !== index),
    )
  }

  const onSubmit = (data: AnnotationFormData) => {
    if (submitting) return
    setSubmitting(true)
    timeTracking.stop()

    const completedTask: AnnotationTask = {
      ...task,
      // If EN, we replace claims with translated claim text
      claims: needsTranslation && data.translation ? [data.translation] : data.claims,
      sourceLinks: [data.sourceUrl, ...data.claimLinks].filter(Boolean),
      translation: data.translation,
      translationLanguage: data.translationLanguage,
      articleBody: data.articleBody,
      sourceUrl: data.sourceUrl,
      claimLinks: data.claimLinks,
      verdict: data.verdict,
      startTime: task.startTime,
      endTime: new Date(),
      status: "completed",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-start md:items-center flex-wrap md:flex-nowrap justify-between gap-4 mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center flex-wrap md:flex-nowrap gap-6 min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-[16px] md:text-2xl font-bold text-slate-900 dark:text-slate-100">Annotation Task</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-slate-600 break-all dark:text-slate-400 max-w-full">Row ID: {task.rowId}</p>
                {canEditClaim && (
                  <Badge variant="secondary" className="gap-1">
                    <Edit3 className="h-3 w-3" />
                    Claim Editable
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Clock className="h-4 w-4 text-slate-500" />
              <Badge variant={timeTracking.isIdle ? "destructive" : "secondary"} className="font-mono">
                {timeTracking.formatTime()}
                {timeTracking.isIdle && " (IDLE)"}
              </Badge>
            </div>
            <Avatar className="ring-2 ring-slate-200 dark:ring-slate-700 shrink-0">
              <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 justify-end w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            {/* Mobile button to open Original Data drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2">
                  <FileText className="h-4 w-4" /> Original Data
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="lg:hidden">
                <SheetHeader>
                  <SheetTitle>Original Data</SheetTitle>
                </SheetHeader>
                <div className="mt-4 max-h-[60vh] overflow-auto pr-2">
                  {/* Duplicated read-only fields for mobile drawer */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">ID</Label>
                      <div className="mt-1 text-sm">{task.csvRow.data[0] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Extracted Claim Text</Label>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{task.csvRow.data[1] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verdict</Label>
                      <div className="mt-1 text-sm">{task.csvRow.data[2] || "(empty)"}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Domain</Label>
                        <div className="mt-1 text-sm">{task.csvRow.data[3] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Claim Language</Label>
                        <div className="mt-1 text-sm">{task.csvRow.data[4] || "(empty)"}</div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Source URL</Label>
                      <div className="mt-1 break-all text-sm">{task.csvRow.data[7] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Claim Links</Label>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{task.csvRow.data[5] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Claim Platforms</Label>
                      <div className="mt-1 text-sm">{task.csvRow.data[6] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Platform</Label>
                      <div className="mt-1 text-sm">{task.csvRow.data[8] || "(empty)"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Article Body</Label>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{task.csvRow.data[9] || "(empty)"}</div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={handlePauseResume} className="gap-2 bg-transparent">
              {timeTracking.isActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            className={`grid grid-cols-1 gap-6 ${
              showOriginalDesktop ? "lg:grid-cols-[18rem_1fr]" : "lg:grid-cols-[7rem_1fr]"
            }`}
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
                    onClick={() => setShowOriginalDesktop(v => !v)}
                  >
                    {showOriginalDesktop ? "Hide" : "Show"}
                  </Button>
                </CardHeader>
                {showOriginalDesktop && (
                  <CardContent className="space-y-4 p-6">
                    {/* Labeled fields based on header screenshot; omit metadata (K) */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID</Label>
                        <div className="mt-1 text-sm">{task.csvRow.data[0] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Extracted Claim Text
                        </Label>
                        <div className="mt-1 text-sm whitespace-pre-wrap break-all">
                          {task.csvRow.data[1] || "(empty)"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Verdict</Label>
                        <div className="mt-1 text-sm break-all">{task.csvRow.data[2] || "(empty)"}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Domain</Label>
                          <div className="mt-1 text-sm break-all">{task.csvRow.data[3] || "(empty)"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Claim Language
                          </Label>
                          <div className="mt-1 text-sm break-all">{task.csvRow.data[4] || "(empty)"}</div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source URL</Label>
                        <div className="mt-1 break-all text-sm">{task.csvRow.data[7] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Claim Links</Label>
                        <div className="mt-1 text-sm whitespace-pre-wrap break-all">
                          {task.csvRow.data[5] || "(empty)"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Claim Platforms
                        </Label>
                        <div className="mt-1 text-sm break-all">{task.csvRow.data[6] || "(empty)"}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform</Label>
                        <div className="mt-1 text-sm break-all">{task.csvRow.data[8] || "(empty)"}</div>
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
                        {timeTracking.isIdle && (
                          <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Idle detected</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <div>
              <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Annotation Form</CardTitle>
                  <CardDescription>Edit and annotate the claim data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Verdict editing when unrated */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                        Rating / Verdict
                      </Label>
                      {canEditVerdict ? (
                        <Badge variant="secondary" className="gap-1">
                          <Edit3 className="h-3 w-3" /> Editable
                        </Badge>
                      ) : null}
                    </div>
                    <Select
                      value={watchedValues.verdict || undefined}
                      onValueChange={val => setValue("verdict", val as any)}
                      disabled={!canEditVerdict}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select verdict" />
                      </SelectTrigger>
                      <SelectContent>
                        {VerdictEnum.options.map(v => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!canEditVerdict && (
                      <p className="text-xs text-muted-foreground">
                        Verdict is already set. Editing is restricted to unrated rows.
                      </p>
                    )}
                  </div>
                  {/* Claims and translation handling */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                        {needsTranslation
                          ? "Translated Claim Text"
                          : canEditClaim
                            ? "Extracted Claim Text (Editable)"
                            : "Claims"}
                      </Label>
                      {!needsTranslation && !canEditClaim && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addClaim}
                          className="gap-2 bg-transparent"
                        >
                          <Plus className="h-4 w-4" />
                          Add Claim
                        </Button>
                      )}
                    </div>
                    {!needsTranslation && (
                      <div className="space-y-3">
                        {watchedValues.claims.map((claim, index) => (
                          <div key={index} className="flex gap-2">
                            <Textarea
                              placeholder={
                                canEditClaim ? "Edit the extracted claim text..." : `Enter claim ${index + 1}...`
                              }
                              value={claim}
                              onChange={e => updateClaim(index, e.target.value)}
                              className="min-h-[100px] resize-none break-all"
                              disabled={!canEditClaim && index === 0 && Boolean(extractedClaimText)}
                            />
                            {!canEditClaim && watchedValues.claims.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeClaim(index)}
                                className="shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {needsTranslation && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Target Language
                          </Label>
                          <Tabs
                            value={watchedValues.translationLanguage || undefined}
                            onValueChange={val => setValue("translationLanguage", val as any)}
                            className="mt-2"
                          >
                            <TabsList className="grid grid-cols-2 w-fit">
                              <TabsTrigger value="ha">Hausa</TabsTrigger>
                              <TabsTrigger value="yo">Yoruba</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        <Textarea
                          placeholder="Enter translated claim text..."
                          value={watchedValues.translation || ""}
                          onChange={e => setValue("translation", e.target.value)}
                          className="min-h-[100px] break-all"
                        />
                      </div>
                    )}
                    {errors.claims && <p className="text-sm text-red-600 mt-2">{errors.claims.message}</p>}
                  </div>
                  {/* Source URL (immutable) and Claim Links (editable) */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Source URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input value={watchedValues.sourceUrl || ""} disabled className="break-all" />
                        {!!watchedValues.sourceUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(watchedValues.sourceUrl, "_blank")}
                            className="shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Claim Links</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addClaimLink}
                          className="gap-2 bg-transparent"
                        >
                          <Plus className="h-4 w-4" /> Add Link
                        </Button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(Array.isArray(watchedValues.claimLinks) ? watchedValues.claimLinks : [""]).map(
                          (link, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder={`Enter claim link ${index + 1}...`}
                                value={String(link || "")}
                                onChange={e => updateClaimLink(index, e.target.value)}
                                className="break-all"
                              />
                              {link && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link, "_blank")}
                                  className="shrink-0"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeClaimLink(index)}
                                className="shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                      {errors.claimLinks && (
                        <p className="text-sm text-red-600 mt-2">{(errors as any).claimLinks?.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Article body editing or translation */}
                  <div>
                    <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                      {needsTranslation ? "Translated Article Body" : "Article Body (Editable)"}
                    </Label>
                    <Textarea
                      placeholder={needsTranslation ? "Enter translated article body..." : "Edit article body..."}
                      value={watchedValues.articleBody || ""}
                      onChange={e => setValue("articleBody", e.target.value)}
                      className="min-h-[140px] mt-2 break-all"
                    />
                  </div>
                  {needsTranslation && errors.translation && (
                    <p className="text-sm text-red-600">{errors.translation.message}</p>
                  )}

                  <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="submit"
                      className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90"
                      isLoading={submitting}
                      disabled={timeTracking.isIdle || !isValid}
                    >
                      <Save className="h-4 w-4" />
                      Complete & Submit
                    </Button>
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
  )
}
