"use client"
import React from "react"
import { useFormContext } from "react-hook-form"
import { ExternalLink, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { CoreVerdictEnum, isCoreVerdict, type AnnotationFormData } from "@/lib/validation"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { BaseAnnotationForm } from "./base-annotation-form"

interface TranslationAnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
}

function TranslationAnnotationFormContent({ user }: { user: User }) {
  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<AnnotationFormData>()
  const watchedValues = watch()

  const isDualTranslator = watchedValues.isDualTranslator || false

  // Determine if user is single-language and what language they can work with
  const userLanguages = user.translationLanguages || []
  const isSingleLanguageUser = userLanguages.length === 1
  const singleLanguage = isSingleLanguageUser ? userLanguages[0] : undefined

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
      {/* Original Claim (Read-only) */}
      <div>
        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">Original Claim (English)</Label>
        <Textarea
          value={watchedValues.claims[0] || ""}
          disabled
          className="min-h-[80px] mt-2 bg-slate-50 dark:bg-slate-800"
        />
      </div>

      {/* Translation Section */}
      <div className="space-y-3">
        {isDualTranslator ? (
          <>
            {/* Dual Translation Mode - Both Languages */}
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Translations (Both Languages Required) <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                As a dual translator, please provide translations for both Hausa and Yoruba.
              </p>
            </div>

            {/* Hausa Translation */}
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Hausa Translation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter Hausa translation of the claim..."
                value={watchedValues.translationHausa || ""}
                onChange={e => setValue("translationHausa", e.target.value)}
                className="min-h-[120px] mt-2 break-all"
              />
              {errors.translationHausa && (
                <p className="text-sm text-red-600 mt-2">{errors.translationHausa.message}</p>
              )}
            </div>

            {/* Yoruba Translation */}
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Yoruba Translation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter Yoruba translation of the claim..."
                value={watchedValues.translationYoruba || ""}
                onChange={e => setValue("translationYoruba", e.target.value)}
                className="min-h-[120px] mt-2 break-all"
              />
              {errors.translationYoruba && (
                <p className="text-sm text-red-600 mt-2">{errors.translationYoruba.message}</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Single Language Translation Mode */}
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Target Language <span className="text-red-500">*</span>
              </Label>
              {isSingleLanguageUser ? (
                <div className="mt-2">
                  <Badge variant="default" className="text-sm">
                    {singleLanguage === "ha" ? "Hausa" : "Yoruba"} (Your configured language)
                  </Badge>
                </div>
              ) : (
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
              )}
              {errors.translationLanguage && (
                <p className="text-sm text-red-600 mt-2">{errors.translationLanguage.message}</p>
              )}
            </div>
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Translated Claim Text <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter translated claim text..."
                value={watchedValues.translation || ""}
                onChange={e => setValue("translation", e.target.value)}
                className="min-h-[120px] mt-2 break-all"
              />
              {errors.translation && <p className="text-sm text-red-600 mt-2">{errors.translation.message}</p>}
            </div>
          </>
        )}
      </div>

      {/* Verdict Selection */}
      <div className="space-y-2">
        <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
          Rating / Verdict <span className="text-red-500">*</span>
        </Label>
        <Select value={watchedValues.verdict || undefined} onValueChange={val => setValue("verdict", val as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select verdict" />
          </SelectTrigger>
          <SelectContent>
            {CoreVerdictEnum.options.map(v => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.verdict && <p className="text-sm text-red-600 mt-2">{errors.verdict.message}</p>}
        {!isCoreVerdict(watchedValues.verdict || "") && (
          <p className="text-xs text-orange-600">
            Current verdict requires correction. Please select TRUE, FALSE, or MISLEADING.
          </p>
        )}
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

      {/* Article Body Translation */}
      {isDualTranslator ? (
        <>
          {/* Dual Translation Article Bodies */}
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
              Hausa Article Body <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter Hausa translation of article body..."
              value={watchedValues.articleBodyHausa || ""}
              onChange={e => setValue("articleBodyHausa", e.target.value)}
              className="min-h-[140px] mt-2 break-all"
            />
            {errors.articleBodyHausa && <p className="text-sm text-red-600 mt-2">{errors.articleBodyHausa.message}</p>}
          </div>
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
              Yoruba Article Body <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Enter Yoruba translation of article body..."
              value={watchedValues.articleBodyYoruba || ""}
              onChange={e => setValue("articleBodyYoruba", e.target.value)}
              className="min-h-[140px] mt-2 break-all"
            />
            {errors.articleBodyYoruba && (
              <p className="text-sm text-red-600 mt-2">{errors.articleBodyYoruba.message}</p>
            )}
          </div>
        </>
      ) : isSingleLanguageUser ? (
        <>
          {/* Single Language User - Show appropriate field */}
          {singleLanguage === "ha" ? (
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Hausa Article Body <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter Hausa translation of article body..."
                value={watchedValues.articleBodyHausa || ""}
                onChange={e => setValue("articleBodyHausa", e.target.value)}
                className="min-h-[140px] mt-2 break-all"
              />
              {errors.articleBodyHausa && (
                <p className="text-sm text-red-600 mt-2">{errors.articleBodyHausa.message}</p>
              )}
            </div>
          ) : (
            <div>
              <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
                Yoruba Article Body <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Enter Yoruba translation of article body..."
                value={watchedValues.articleBodyYoruba || ""}
                onChange={e => setValue("articleBodyYoruba", e.target.value)}
                className="min-h-[140px] mt-2 break-all"
              />
              {errors.articleBodyYoruba && (
                <p className="text-sm text-red-600 mt-2">{errors.articleBodyYoruba.message}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <div>
          <Label className="text-base font-medium text-slate-900 dark:text-slate-100">
            Translated Article Body <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Enter translated article body..."
            value={watchedValues.articleBody || ""}
            onChange={e => setValue("articleBody", e.target.value)}
            className="min-h-[140px] mt-2 break-all"
          />
          {errors.articleBody && <p className="text-sm text-red-600 mt-2">{errors.articleBody.message}</p>}
        </div>
      )}
    </>
  )
}

export function TranslationAnnotationForm({ task, user, onComplete, onCancel }: TranslationAnnotationFormProps) {
  return (
    <BaseAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} mode="translation">
      <TranslationAnnotationFormContent user={user} />
    </BaseAnnotationForm>
  )
}
