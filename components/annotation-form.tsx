"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Clock, Plus, X, Save, ArrowLeft, ExternalLink, Pause, Play, Edit3 } from "lucide-react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { setCurrentTask } from "@/lib/data-store"
import { useTimeTracking } from "@/hooks/use-time-tracking"
import { annotationFormSchema, type AnnotationFormData } from "@/lib/validation"

interface AnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
}

export function AnnotationForm({ task, user, onComplete, onCancel }: AnnotationFormProps) {
  const [canEditClaim, setCanEditClaim] = useState(false)
  const [extractedClaimText, setExtractedClaimText] = useState("")
  const { toast } = useToast()

  const form = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      claims: task.claims.length > 0 ? task.claims : [""],
      sourceLinks: task.sourceLinks.length > 0 ? task.sourceLinks : [""],
      translation: task.translation || "",
      needsTranslation: false,
      canEditSourceLinks: false,
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

  useEffect(() => {
    const csvData = task.csvRow.data
    const ratingStatus = csvData[2] || ""
    const claimText = csvData[0] || ""

    const isEditable = ratingStatus.toLowerCase() === "unrated" || ratingStatus === ""
    setCanEditClaim(isEditable)
    setExtractedClaimText(claimText)

    if (isEditable && claimText) {
      setValue("claims", [claimText])
      // Show informational toast about claim editability
      toast({
        title: "Claim Editable",
        description: "This claim is unrated and can be edited. Make corrections as needed before proceeding.",
        variant: "default",
      })
    }
  }, [task.csvRow.data, setValue, toast])

  const timeTracking = useTimeTracking({
    idleThreshold: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      toast({
        title: "Session Timeout Warning",
        description: "You've been inactive for a while. Your session will timeout soon. Move your mouse or click anywhere to continue working.",
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

  useEffect(() => {
    const currentFormData = getValues()
    const updatedTask: AnnotationTask = {
      ...task,
      claims: currentFormData.claims,
      sourceLinks: currentFormData.sourceLinks,
      translation: currentFormData.translation,
    }
    setCurrentTask(updatedTask)
  }, [watchedValues])

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

  const addSourceLink = () => {
    const currentLinks = getValues("sourceLinks")
    setValue("sourceLinks", [...currentLinks, ""])
  }

  const updateSourceLink = (index: number, value: string) => {
    const currentLinks = getValues("sourceLinks")
    const updatedLinks = currentLinks.map((link, i) => (i === index ? value : link))
    setValue("sourceLinks", updatedLinks)
  }

  const removeSourceLink = (index: number) => {
    const currentLinks = getValues("sourceLinks")
    if (currentLinks.length > 1) {
      setValue(
        "sourceLinks",
        currentLinks.filter((_, i) => i !== index),
      )
    }
  }

  const onSubmit = (data: AnnotationFormData) => {
    timeTracking.stop()

    const completedTask: AnnotationTask = {
      ...task,
      claims: data.claims,
      sourceLinks: data.sourceLinks,
      translation: data.translation,
      startTime: task.startTime,
      endTime: new Date(),
      status: "completed",
    }

    localStorage.removeItem(`annotation_progress_${task.id}`)
    onComplete(completedTask)
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
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-6">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Annotation Task</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">Row ID: {task.rowId}</p>
                {canEditClaim && (
                  <Badge variant="secondary" className="gap-1">
                    <Edit3 className="h-3 w-3" />
                    Claim Editable
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <Badge variant={timeTracking.isIdle ? "destructive" : "secondary"} className="font-mono">
                {timeTracking.formatTime()}
                {timeTracking.isIdle && " (IDLE)"}
              </Badge>
            </div>
            <Avatar className="ring-2 ring-slate-200 dark:ring-slate-700">
              <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Original Data</CardTitle>
                  <CardDescription>Reference information from the CSV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Raw Data</Label>
                    <div className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border">
                      {task.csvRow.data.map((item, index) => (
                        <div key={index} className="text-sm mb-2 last:mb-0">
                          <span className="font-medium text-slate-600 dark:text-slate-400">Col {index + 1}:</span>{" "}
                          <span className="text-slate-900 dark:text-slate-100">{item || "(empty)"}</span>
                        </div>
                      ))}
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
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Annotation Form</CardTitle>
                  <CardDescription>Edit and annotate the claim data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                        {canEditClaim ? "Extracted Claim Text (Editable)" : "Claims"}
                      </Label>
                      {!canEditClaim && (
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

                    <div className="space-y-3">
                      {watchedValues.claims.map((claim, index) => (
                        <div key={index} className="flex gap-2">
                          <Textarea
                            placeholder={
                              canEditClaim ? "Edit the extracted claim text..." : `Enter claim ${index + 1}...`
                            }
                            value={claim}
                            onChange={(e) => updateClaim(index, e.target.value)}
                            className="min-h-[100px] resize-none"
                            disabled={!canEditClaim && index === 0 && extractedClaimText}
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
                    {errors.claims && <p className="text-sm text-red-600 mt-2">{errors.claims.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Source Links</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="edit-sources" className="text-sm text-slate-700 dark:text-slate-300">
                          Allow editing
                        </Label>
                        <Switch
                          id="edit-sources"
                          checked={watchedValues.canEditSourceLinks}
                          onCheckedChange={(checked) => setValue("canEditSourceLinks", checked)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {watchedValues.sourceLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder={`Enter source link ${index + 1}...`}
                              value={link}
                              onChange={(e) => updateSourceLink(index, e.target.value)}
                              disabled={!watchedValues.canEditSourceLinks}
                            />
                          </div>
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
                          {watchedValues.canEditSourceLinks && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSourceLink()}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {watchedValues.canEditSourceLinks && watchedValues.sourceLinks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSourceLink(index)}
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.sourceLinks && <p className="text-sm text-red-600 mt-2">{errors.sourceLinks.message}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Translation</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="needs-translation" className="text-sm text-slate-700 dark:text-slate-300">
                          Requires translation
                        </Label>
                        <Switch
                          id="needs-translation"
                          checked={watchedValues.needsTranslation}
                          onCheckedChange={(checked) => setValue("needsTranslation", checked)}
                        />
                      </div>
                    </div>
                    {watchedValues.needsTranslation && (
                      <Textarea
                        placeholder="Enter English translation..."
                        value={watchedValues.translation || ""}
                        onChange={(e) => setValue("translation", e.target.value)}
                        className="min-h-[100px]"
                      />
                    )}
                    {!watchedValues.needsTranslation && (
                      <p className="text-sm text-muted-foreground italic">
                        Content is already in English - no translation needed
                      </p>
                    )}
                    {errors.translation && <p className="text-sm text-red-600 mt-2">{errors.translation.message}</p>}
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="submit"
                      className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90"
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
