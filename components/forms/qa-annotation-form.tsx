"use client"

import { useFormContext } from "react-hook-form"
import { ExternalLink, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { VerdictEnum, CoreVerdictEnum, isCoreVerdict, type AnnotationFormData } from "@/lib/validation"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { BaseAnnotationForm } from "./base-annotation-form"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { BaseQAForm } from "./base-qa-form"

interface QAAnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
}

function QAAnnotationFormContent({ task, user }: { task: AnnotationTask; user: User }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AnnotationFormData>()
  const watchedValues = watch()
  const [editMode, setEditMode] = useState(false)
  const [showSelfVerificationWarning, setShowSelfVerificationWarning] = useState(false)

  const claimLanguage = (task.csvRow.data[4] || "").trim().toLowerCase()
  const needsTranslation = claimLanguage === "en"

  // Check if this user was the original annotator
  useEffect(() => {
    const cannotSelfVerify = task.annotatorId === user.id
    setShowSelfVerificationWarning(cannotSelfVerify)
  }, [task.annotatorId, user.id])

  return (
    <>
      {showSelfVerificationWarning && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Warning: You cannot perform QA on your own annotation. This task should be assigned to a different annotator
            for quality assurance.
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Mode Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">QA Review Mode</Label>
          <div className="flex items-center space-x-2">
            <EyeOff className="h-4 w-4 text-slate-500" />
            <Switch checked={editMode} onCheckedChange={setEditMode} disabled={showSelfVerificationWarning} />
            <Eye className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">{editMode ? "Edit Mode" : "Review Mode"}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {editMode ? "You can now edit the annotation content." : "Content is read-only for review."}
        </p>
      </div>

      {/* Original vs Translated Claims */}
      {needsTranslation ? (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Original Claim (English)</Label>
            <Textarea
              value={task.csvRow.data[1] || ""}
              disabled
              className="min-h-[80px] mt-2 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Claim Text (Hausa)</Label>
              <Textarea
                value={(watchedValues as any).translationHausa || ""}
                onChange={e => editMode && setValue("translationHausa" as any, e.target.value)}
                disabled={!editMode}
                className="min-h-[100px] mt-2"
              />
            </div>
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Claim Text (Yoruba)</Label>
              <Textarea
                value={(watchedValues as any).translationYoruba || ""}
                onChange={e => editMode && setValue("translationYoruba" as any, e.target.value)}
                disabled={!editMode}
                className="min-h-[100px] mt-2"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Claims</Label>
          <div className="space-y-3 mt-2">
            {watchedValues.claims.map((claim, index) => (
              <Textarea
                key={index}
                value={claim}
                onChange={e => {
                  if (editMode) {
                    const currentClaims = watchedValues.claims
                    const updatedClaims = currentClaims.map((c, i) => (i === index ? e.target.value : c))
                    setValue("claims", updatedClaims)
                  }
                }}
                disabled={!editMode}
                className="min-h-[100px] resize-none"
                placeholder={`Claim ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Verdict Display */}
      <div className="space-y-2">
        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Current Verdict</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {watchedValues.verdict || "Not Set"}
          </Badge>
          {editMode && (
            <Select value={watchedValues.verdict || undefined} onValueChange={val => setValue("verdict", val as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Change verdict" />
              </SelectTrigger>
              <SelectContent>
                {/* Show only core verdicts if current verdict is not a core verdict */}
                {!isCoreVerdict(watchedValues.verdict || "")
                  ? CoreVerdictEnum.options.map(v => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))
                  : VerdictEnum.options.map(v => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {errors.verdict && <p className="text-sm text-red-600 mt-2">{errors.verdict.message}</p>}
        {editMode && !isCoreVerdict(watchedValues.verdict || "") && (
          <p className="text-xs text-orange-600">
            Current verdict requires correction. Please select TRUE, FALSE, or MISLEADING.
          </p>
        )}
      </div>

      {/* Source Information (Read-only) */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Source URL</Label>
          <div className="flex gap-2 mt-2">
            <Input value={watchedValues.sourceUrl || ""} disabled className="break-all bg-slate-50 dark:bg-slate-800" />
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
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Claim Links</Label>
          <div className="mt-2 space-y-2">
            {(Array.isArray(watchedValues.claimLinks) ? watchedValues.claimLinks : []).map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={String(link || "")}
                  disabled={!editMode}
                  onChange={e => {
                    if (editMode) {
                      const currentLinks = watchedValues.claimLinks
                      const updatedLinks = currentLinks.map((l, i) => (i === index ? e.target.value : l))
                      setValue("claimLinks", updatedLinks)
                    }
                  }}
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Article Body */}
      {needsTranslation ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Article Body (Hausa)</Label>
            <Textarea
              value={(watchedValues as any).articleBodyHausa || ""}
              onChange={e => editMode && setValue("articleBodyHausa" as any, e.target.value)}
              disabled={!editMode}
              className="min-h-[120px] mt-2"
            />
          </div>
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Article Body (Yoruba)</Label>
            <Textarea
              value={(watchedValues as any).articleBodyYoruba || ""}
              onChange={e => editMode && setValue("articleBodyYoruba" as any, e.target.value)}
              disabled={!editMode}
              className="min-h-[120px] mt-2"
            />
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Article Body</Label>
          <Textarea
            value={watchedValues.articleBody || ""}
            onChange={e => editMode && setValue("articleBody", e.target.value)}
            disabled={!editMode}
            className="min-h-[140px] mt-2"
          />
        </div>
      )}

      {/* QA Comments */}
      <div>
        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">QA Comments</Label>
        <Textarea
          placeholder="Add your review comments..."
          value={watchedValues.qaComments || ""}
          onChange={e => setValue("qaComments", e.target.value)}
          className="min-h-[100px] mt-2"
        />
        {errors.qaComments && <p className="text-sm text-red-600 mt-2">{errors.qaComments.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Provide feedback for the annotator and any recommendations for improvement.
        </p>
      </div>
    </>
  )
}

export function QAAnnotationForm({ task, user, onComplete, onCancel }: QAAnnotationFormProps) {
  return (
    <BaseQAForm task={task} user={user} onComplete={onComplete} onCancel={onCancel}>
      <QAAnnotationFormContent task={task} user={user} />
    </BaseQAForm>
  )
}
