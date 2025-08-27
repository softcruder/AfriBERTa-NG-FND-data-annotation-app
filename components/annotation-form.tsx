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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Plus, X, Save, ArrowLeft, ExternalLink, Pause, Play, AlertTriangle } from "lucide-react"
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
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

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

  const timeTracking = useTimeTracking({
    idleThreshold: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      setShowTimeoutWarning(true)
    },
    onResume: () => {
      setShowTimeoutWarning(false)
    },
    onTimeout: () => {
      handleAutoSave()
    },
  })

  // Start time tracking when component mounts
  useEffect(() => {
    timeTracking.start()
    return () => {
      timeTracking.stop()
    }
  }, [])

  // Auto-save current task state
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
    } catch (error) {
      console.error("Failed to auto-save progress:", error)
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
    if (confirm("Are you sure you want to cancel this task? Your progress will be lost.")) {
      timeTracking.stop()
      localStorage.removeItem(`annotation_progress_${task.id}`)
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Annotation Task</h1>
            <p className="text-sm text-muted-foreground">Row ID: {task.rowId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePauseResume}>
            {timeTracking.isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Badge variant={timeTracking.isIdle ? "destructive" : "secondary"} className="font-mono">
              {timeTracking.formatTime()}
              {timeTracking.isIdle && " (IDLE)"}
            </Badge>
          </div>
          <Avatar>
            <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {showTimeoutWarning && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You've been inactive for a while. Your session will timeout soon. Move your mouse or click anywhere to
            continue working.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Original Data Reference */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Data</CardTitle>
                <CardDescription>Reference information from the CSV</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Raw Data</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {task.csvRow.data.map((item, index) => (
                      <div key={index} className="text-sm mb-1">
                        <span className="font-medium">Col {index + 1}:</span> {item || "(empty)"}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Session Stats</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Active Time:</span> {timeTracking.formatTime()}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      <Badge variant={timeTracking.isActive ? "default" : "secondary"} className="text-xs">
                        {timeTracking.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    {timeTracking.isIdle && (
                      <div className="text-sm text-yellow-600">
                        <span className="font-medium">Idle detected</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Annotation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Annotation Form</CardTitle>
                <CardDescription>Edit and annotate the claim data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Claims Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Claims</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addClaim}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Claim
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {watchedValues.claims.map((claim, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          placeholder={`Enter claim ${index + 1}...`}
                          value={claim}
                          onChange={(e) => updateClaim(index, e.target.value)}
                          className="min-h-[80px]"
                        />
                        {watchedValues.claims.length > 1 && (
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
                  {errors.claims && <p className="text-sm text-red-600 mt-1">{errors.claims.message}</p>}
                </div>

                {/* Source Links Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Source Links</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-sources" className="text-sm">
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
                  {errors.sourceLinks && <p className="text-sm text-red-600 mt-1">{errors.sourceLinks.message}</p>}
                </div>

                {/* Translation Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Translation</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="needs-translation" className="text-sm">
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
                  {errors.translation && <p className="text-sm text-red-600 mt-1">{errors.translation.message}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={timeTracking.isIdle || !isValid}>
                    <Save className="mr-2 h-4 w-4" />
                    Complete & Submit
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
