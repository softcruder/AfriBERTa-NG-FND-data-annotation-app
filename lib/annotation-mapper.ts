import type { AnnotationTask } from "@/lib/data-store"
import type { AnnotationRow } from "@/lib/google-apis"

export interface AnnotationData {
  rowId: string
  annotatorId: string
  claimText: string
  sourceLinks: string[]
  translation?: string
  verdict: string // allow empty string when verdict not set yet
  sourceUrl: string
  claimLinks: string[]
  claim_text_ha?: string
  claim_text_yo?: string
  article_body_ha?: string
  article_body_yo?: string
  translationLanguage?: "ha" | "yo"
  originalLanguage?: string
  requiresTranslation?: boolean
  startTime: string
  endTime: string
  durationMinutes: number
  status: "completed"
}

export class AnnotationMapper {
  static taskToAnnotation(task: AnnotationTask, annotatorId: string): AnnotationData {
    const duration =
      task.startTime && task.endTime ? Math.round((task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60)) : 0

    const lang = (task.csvRow.data[4] || "").trim().toLowerCase()
    const isEN = lang === "en" || lang === "english"
    const targetLang = (task.translation ? (task as any).translationLanguage : undefined) as "ha" | "yo" | undefined

    // Map language-specific fields
    // Behavior:
    // 1. If original is EN, we store translated claim/article body into the corresponding *_ha / *_yo fields depending on targetLang.
    // 2. If original is HA or YO (direct annotation), we store the original claim/article body directly in that language column.
    // 3. We always prefer explicit per-language fields (translationHausa / articleBodyHausa etc.) over generic ones.

    let claim_text_ha: string | undefined
    let claim_text_yo: string | undefined
    let article_body_ha: string | undefined
    let article_body_yo: string | undefined

    const combinedClaim = task.claims.join(" | ")

    if (isEN) {
      if (targetLang === "ha") {
        claim_text_ha = task.translationHausa || combinedClaim
        article_body_ha = task.articleBodyHausa || task.articleBody || ""
      } else if (targetLang === "yo") {
        claim_text_yo = task.translationYoruba || combinedClaim
        article_body_yo = task.articleBodyYoruba || task.articleBody || ""
      } else {
        // If target language not explicitly specified but translations exist, capture them
        if (task.translationHausa) claim_text_ha = task.translationHausa
        if (task.translationYoruba) claim_text_yo = task.translationYoruba
        if (task.articleBodyHausa) article_body_ha = task.articleBodyHausa
        if (task.articleBodyYoruba) article_body_yo = task.articleBodyYoruba
      }
    } else {
      // Direct Hausa or Yoruba annotation (no translation required)
      if (lang === "ha") {
        claim_text_ha = task.translationHausa || combinedClaim
        article_body_ha = task.articleBodyHausa || task.articleBody || ""
      } else if (lang === "yo") {
        claim_text_yo = task.translationYoruba || combinedClaim
        article_body_yo = task.articleBodyYoruba || task.articleBody || ""
      }
    }

    return {
      rowId: task.rowId,
      annotatorId,
      claimText: task.claims.join(" | "),
      sourceLinks: task.sourceLinks,
      translation: task.translation,
      verdict: task.verdict ?? "",
      sourceUrl: (task as any).sourceUrl || task.sourceLinks[0] || "",
      claimLinks: (task as any).claimLinks ?? (task.sourceLinks || []).slice(1),
      claim_text_ha,
      claim_text_yo,
      article_body_ha,
      article_body_yo,
      translationLanguage: targetLang,
      originalLanguage: isEN ? "en" : lang,
      requiresTranslation: isEN,
      startTime: task.startTime?.toISOString() || "",
      endTime: task.endTime?.toISOString() || "",
      durationMinutes: duration,
      status: "completed" as const,
    }
  }

  static annotationRowToTask(item: AnnotationRow): AnnotationTask | null {
    if (!item) return null

    // Build a safer, typed adapter
    const hasHa = Boolean(item.claim_text_ha || item.article_body_ha)
    const hasYo = Boolean(item.claim_text_yo || item.article_body_yo)
    const inferredLang = hasHa || hasYo || item.translationLanguage ? "en" : ""

    // Prepare CSV-shape data
    const csvData: string[] = new Array(8).fill("")
    csvData[0] = item.rowId
    csvData[1] = item.claimText || ""
    csvData[2] = item.verdict || ""
    csvData[4] = inferredLang
    csvData[5] = (item.claimLinks || []).join("; ")
    csvData[7] = item.sourceUrl || ""

    // Map row status to task status
    const taskStatus: AnnotationTask["status"] = (() => {
      switch (item.status) {
        case "in-progress":
        case "completed":
        case "qa-pending":
        case "qa-approved":
        case "admin-review":
          return item.status
        default:
          return "qa-pending"
      }
    })()

    return {
      id: item.rowId,
      rowId: item.rowId,
      annotatorId: item.annotatorId,
      status: taskStatus,
      csvRow: { id: item.rowId, originalIndex: -1, data: csvData, header: [] },
      claims: [item.claimText || ""],
      sourceLinks: item.sourceLinks ?? [],
      claimLinks: item.claimLinks || [],
      sourceUrl: item.sourceUrl || "",
      translation: item.translation || "",
      translationLanguage: item.translationLanguage,
      verdict: item.verdict || "",
      translationHausa: item.claim_text_ha || "",
      translationYoruba: item.claim_text_yo || "",
      articleBodyHausa: item.article_body_ha || "",
      articleBodyYoruba: item.article_body_yo || "",
      isValid: item.isValid,
      invalidityReason: item.invalidityReason,
      adminComments: item.adminComments,
    }
  }
}
