import type { AnnotationTask } from "@/lib/data-store"
import { CSVParser } from "./csv-parser"

export class TaskService {
  static async createTaskFromCSV(csvFileId: string, rowId: string): Promise<AnnotationTask> {
    const res = await fetch(`/api/drive/csv/${encodeURIComponent(csvFileId)}`)
    if (!res.ok) throw new Error("Failed to load CSV")

    const json = (await res.json()) as { data: string[][] }
    const csv = json.data

    const row = CSVParser.findRowById(csv, rowId)
    if (!row) throw new Error("Row not found in CSV by ID")

    const claimData = CSVParser.extractClaimData(row.data)
    const linksArray = [claimData.sourceUrl, ...claimData.claimLinks].filter(Boolean)

    return {
      id: `task_${Date.now()}`,
      rowId,
      csvRow: row,
      startTime: new Date(),
      claims: [claimData.claim],
      sourceLinks: linksArray.length ? linksArray : [""],
      verdict: claimData.verdict,
      status: "in-progress",
    }
  }

  static calculateDuration(startTime?: Date, endTime?: Date): number {
    if (!startTime || !endTime) return 0
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
  }

  static determineSubmissionType(task: AnnotationTask): "translation" | "regular" {
    const lang = (task.csvRow.data[4] || "").trim().toLowerCase()
    const isEN = lang === "en" || lang === "english"

    const isTranslationSubmission =
      isEN &&
      !!(
        (task as any).translation ||
        (task as any).translationLanguage ||
        (task as any).claim_text_ha ||
        (task as any).claim_text_yo ||
        (task as any).article_body_ha ||
        (task as any).article_body_yo
      )

    return isTranslationSubmission ? "translation" : "regular"
  }
}
