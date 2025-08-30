import { z } from "zod"

// Allowed verdict values for selection UI
export const VerdictEnum = z.enum(["True", "False", "Misleading", "Partly True", "Unverifiable", "Other"])

export const annotationFormSchema = z
  .object({
    // Editable claims (may be replaced by translation in EN workflow)
    claims: z.array(z.string().min(1, "Claim cannot be empty")).min(1, "At least one claim is required"),
    // Distinguish immutable sourceUrl from editable claimLinks
    // Source URL comes from CSV and is immutable in the UI; don't block submission if it's malformed.
    sourceUrl: z.string().default(""),
    // Allow blanks while editing; they will be filtered out on transform.
    claimLinks: z
      .array(z.union([z.string().url("Must be a valid URL"), z.literal("")]))
      .default([])
      .transform(arr => arr.filter(link => !!link && link.trim().length > 0)),
    // Translation fields (shown/required only when claim language is EN via UI logic)
    translation: z.string().optional(),
    translationLanguage: z.enum(["ha", "yo"]).optional(),
    needsTranslation: z.boolean(),
    // Optional editable article body (may hold translated content in EN workflow)
    articleBody: z.string().optional(),
    // Verdict via select
    verdict: VerdictEnum.optional(),
  })
  .refine(
    data => {
      if (data.needsTranslation) {
        const hasText = Boolean(data.translation && data.translation.trim().length > 0)
        const hasLang = Boolean(data.translationLanguage)
        return hasText && hasLang
      }
      return true
    },
    {
      message: "Translation text and target language are required when translation is needed",
      path: ["translation"],
    },
  )

export type AnnotationFormData = z.infer<typeof annotationFormSchema>

export const exportConfigSchema = z.object({
  format: z.enum(["csv", "json", "xlsx"]),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
  annotators: z.array(z.string()).optional(),
  includePayments: z.boolean().default(false),
  includeTimeTracking: z.boolean().default(false),
})

export type ExportConfig = z.infer<typeof exportConfigSchema>
