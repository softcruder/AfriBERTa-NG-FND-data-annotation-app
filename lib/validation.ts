import { z } from "zod"

// Core verdict values that require editing if verdict is something else
export const CoreVerdictEnum = z.enum(["True", "False", "Misleading"])

// All possible verdict values (including non-core ones that need to be changed)
export const VerdictEnum = z.enum(["True", "False", "Misleading", "Partly True", "Unverifiable", "Other", "Not Valid"])

// Check if a verdict is one of the core values (True, False, Misleading)
export function isCoreVerdict(verdict: string): boolean {
  return ["True", "False", "Misleading"].includes(verdict)
}

export const annotationFormSchema = z
  .object({
    // Editable claims (may be replaced by translation in EN workflow)
    claims: z.array(z.string().min(1, "Claim cannot be empty")).min(1, "At least one claim is required"),
    // Distinguish immutable sourceUrl from editable claimLinks
    // Source URL comes from CSV and is immutable in the UI; don't block submission if it's malformed.
    sourceUrl: z.string().default(""),
    // Allow blanks while editing; they will be filtered out on transform.
    claimLinks: z
      .array(z.string())
      .default([])
      .transform(arr => arr.filter(link => !!link && link.trim().length > 0)),
    // Translation fields (shown/required only when claim language is EN via UI logic)
    translation: z.string().optional(),
    translationLanguage: z.enum(["ha", "yo"]).optional(),
    // Dual translation fields for translators who can handle both languages
    translationHausa: z.string().optional(),
    translationYoruba: z.string().optional(),
    isDualTranslator: z.boolean().default(false),
    needsTranslation: z.boolean(),
    // Optional editable article body (may hold translated content in EN workflow)
    articleBody: z.string().optional(),
    // Dual translation article bodies
    articleBodyHausa: z.string().optional(),
    articleBodyYoruba: z.string().optional(),
    // Verdict via select - required for completion, with silent handling of invalid values
    verdict: z
      .string()
      .transform(value => {
        // Silently handle mapping of legacy/invalid verdict values
        const validVerdicts = ["True", "False", "Misleading"]
        if (validVerdicts.includes(value)) {
          return value as "True" | "False" | "Misleading"
        }
        // Map common legacy values silently
        switch (value) {
          case "Correct":
          case "correct":
            return undefined as any // Map to undefined to trigger required validation
          case "Incorrect":
          case "incorrect":
            return undefined as any // Map to undefined to trigger required validation
          case "Partially Correct":
          case "Partly True":
            return undefined as any // Map to undefined to trigger required validation
          default:
            // For any other invalid value, default to undefined to trigger required validation
            return undefined as any
        }
      })
      .pipe(CoreVerdictEnum),
    // Task validity fields
    isValid: z.boolean().default(true),
    invalidityReason: z.string().optional(),
    // QA mode flag
    isQAMode: z.boolean().default(false),
    // QA comments for quality assurance review
    qaComments: z.string().optional(),
  })
  .refine(
    data => {
      if (data.needsTranslation) {
        if (data.isDualTranslator) {
          // For dual translators, require both Hausa and Yoruba translations
          const hasHausaText = Boolean(data.translationHausa && data.translationHausa.trim().length > 0)
          const hasYorubaText = Boolean(data.translationYoruba && data.translationYoruba.trim().length > 0)
          return hasHausaText && hasYorubaText
        } else {
          // For single language translators, require translation text and language selection
          const hasText = Boolean(data.translation && data.translation.trim().length > 0)
          const hasLang = Boolean(data.translationLanguage)
          return hasText && hasLang
        }
      }
      return true
    },
    {
      message: "Translation text and target language are required when translation is needed",
      path: ["translation"],
    },
  )
  .refine(
    data => {
      // For dual translators doing translation, both languages must be provided
      if (data.needsTranslation && data.isDualTranslator) {
        const hasHausaText = Boolean(data.translationHausa && data.translationHausa.trim().length > 0)
        if (!hasHausaText) {
          return false
        }
      }
      return true
    },
    {
      message: "Hausa translation is required for dual translators",
      path: ["translationHausa"],
    },
  )
  .refine(
    data => {
      // For dual translators doing translation, both languages must be provided
      if (data.needsTranslation && data.isDualTranslator) {
        const hasYorubaText = Boolean(data.translationYoruba && data.translationYoruba.trim().length > 0)
        if (!hasYorubaText) {
          return false
        }
      }
      return true
    },
    {
      message: "Yoruba translation is required for dual translators",
      path: ["translationYoruba"],
    },
  )
  .refine(
    data => {
      // If task is marked as not valid, require a reason
      if (!data.isValid) {
        return Boolean(data.invalidityReason && data.invalidityReason.trim().length > 0)
      }
      return true
    },
    {
      message: "Please provide a reason when marking task as not valid",
      path: ["invalidityReason"],
    },
  )
  .refine(
    data => {
      // For dual translators, if one article body is provided, both should be provided
      if (data.isDualTranslator) {
        const hasHausaBody = Boolean(data.articleBodyHausa && data.articleBodyHausa.trim().length > 0)
        const hasYorubaBody = Boolean(data.articleBodyYoruba && data.articleBodyYoruba.trim().length > 0)

        // If either has content, both must have content
        if (hasHausaBody && !hasYorubaBody) {
          return false
        }
      }
      return true
    },
    {
      message: "Yoruba article body is required when Hausa article body is provided",
      path: ["articleBodyYoruba"],
    },
  )
  .refine(
    data => {
      // For dual translators, if one article body is provided, both should be provided
      if (data.isDualTranslator) {
        const hasHausaBody = Boolean(data.articleBodyHausa && data.articleBodyHausa.trim().length > 0)
        const hasYorubaBody = Boolean(data.articleBodyYoruba && data.articleBodyYoruba.trim().length > 0)

        // If either has content, both must have content
        if (hasYorubaBody && !hasHausaBody) {
          return false
        }
      }
      return true
    },
    {
      message: "Hausa article body is required when Yoruba article body is provided",
      path: ["articleBodyHausa"],
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
