"use client"

import { useFormContext } from "react-hook-form"
import { Plus, X, ExternalLink, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { VerdictEnum, CoreVerdictEnum, isCoreVerdict, type AnnotationFormData } from "@/lib/validation"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { BaseAnnotationForm } from "./base-annotation-form"
import { useState, useEffect } from "react"

interface RegularAnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => Promise<void> | void
  onCancel: () => void
}

function RegularAnnotationFormContent() {
  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<AnnotationFormData>()
  const watchedValues = watch()
  const [canEditClaim, setCanEditClaim] = useState(false)
  const [canEditVerdict, setCanEditVerdict] = useState(false)

  // Initialize editability based on CSV data and verdict type
  useEffect(() => {
    const currentVerdict = watchedValues.verdict
    const ratingStatus = currentVerdict?.toLowerCase() || ""

    // Claims are editable if unrated or empty
    const isUnrated = !["true", "false", "misleading"].includes(ratingStatus) || !currentVerdict
    setCanEditClaim(isUnrated)

    // Verdict is editable if unrated or not a core verdict (TRUE/FALSE/MISLEADING)
    const isNonCoreVerdict = !isCoreVerdict(currentVerdict)
    setCanEditVerdict(isUnrated || isNonCoreVerdict)
  }, [watchedValues.verdict])

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

  return (
    <>
      {/* Verdict Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
            Rating / Verdict <span className="text-red-500">*</span>
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
            {/* Show only core verdicts if current verdict is not a core verdict */}
            {!isCoreVerdict(watchedValues.verdict ?? "") && canEditVerdict
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
        {errors.verdict && <p className="text-sm text-red-600">{errors.verdict.message}</p>}
        {!canEditVerdict && (
          <p className="text-xs text-muted-foreground">
            Verdict is set to a final value (TRUE/FALSE/MISLEADING). No further editing allowed.
          </p>
        )}
        {canEditVerdict && !isCoreVerdict(watchedValues.verdict ?? "") && (
          <p className="text-xs text-orange-600">
            Current verdict requires correction. Please select TRUE, FALSE, or MISLEADING.
          </p>
        )}
      </div>

      {/* Claims Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
            {canEditClaim ? "Extracted Claim Text (Editable)" : "Claims"} <span className="text-red-500">*</span>
          </Label>
          {!canEditClaim && (
            <Button type="button" variant="outline" size="sm" onClick={addClaim} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Claim
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {watchedValues.claims.map((claim, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder={canEditClaim ? "Edit the extracted claim text..." : `Enter claim ${index + 1}...`}
                value={claim}
                onChange={e => updateClaim(index, e.target.value)}
                className="min-h-[100px] resize-none break-all"
                disabled={!canEditClaim && index === 0}
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

      {/* Source URL and Claim Links */}
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
            <Button type="button" variant="outline" size="sm" onClick={addClaimLink} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" /> Add Link
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {(Array.isArray(watchedValues.claimLinks) ? watchedValues.claimLinks : [""]).map((link, index) => (
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
            ))}
          </div>
          {errors.claimLinks && (
            <p className="text-sm text-red-600 mt-2">
              {Array.isArray(errors.claimLinks)
                ? errors.claimLinks.find(error => error)?.message || "Invalid claim links"
                : errors.claimLinks.message || "Invalid claim links"}
            </p>
          )}
        </div>
      </div>

      {/* Article Body */}
      <div>
        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Article Body (Editable)</Label>
        <Textarea
          placeholder="Edit article body..."
          value={watchedValues.articleBody || ""}
          onChange={e => setValue("articleBody", e.target.value)}
          className="min-h-[140px] mt-2 break-all"
        />
      </div>
    </>
  )
}

export function RegularAnnotationForm({ task, user, onComplete, onCancel }: RegularAnnotationFormProps) {
  return (
    <BaseAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} mode="annotation">
      <RegularAnnotationFormContent />
    </BaseAnnotationForm>
  )
}
