import { z } from "zod"

export const annotationFormSchema = z
  .object({
    claims: z.array(z.string().min(1, "Claim cannot be empty")).min(1, "At least one claim is required"),
    sourceLinks: z.array(z.string().url("Must be a valid URL")).min(1, "At least one source link is required"),
    translation: z.string().optional(),
    needsTranslation: z.boolean(),
    canEditSourceLinks: z.boolean(),
  })
  .refine(
    data => {
      if (data.needsTranslation && (!data.translation || data.translation.trim().length === 0)) {
        return false
      }
      return true
    },
    {
      message: "Translation is required when content needs translation",
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
