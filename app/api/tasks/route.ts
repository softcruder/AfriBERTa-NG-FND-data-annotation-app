import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { downloadCSVFile, getAppConfig, getAnnotations, getFinalDataset } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

/**
 * List available tasks (rows) from the configured source CSV with pagination.
 * Query params:
 * - page: number (1-based)
 * - pageSize: number (default 10, max 100)
 * - fileId: optional override the CSV file id; if missing, use config[CSV_FILE_ID]
 */
// naive in-memory cache for CSV per fileId to reduce repeated downloads within a short window
export const csvCache = new Map<string, { data: string[][]; ts: number }>()
const CONFIG = {
  CSV_TTL_MS: 30_000,
  ANNOTATION_TTL_MS: 60_000,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

export const annotationCache = new Map<string, { rowIds: Set<string>; ts: number }>()
// const ANNOTATION_TTL_MS = 60_000 // Cache annotations longer than CSV

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "tasks:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    if (isNaN(page)) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 })
    }
    const pageSize = Math.min(CONFIG.MAX_PAGE_SIZE, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "5")))
    const overrideFileId = searchParams.get("fileId") || undefined

    // Fetch config once and reuse
    let cfg: any
    try {
      cfg = await getAppConfig(session!.accessToken)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
        return NextResponse.json(
          {
            error: "Google API quota exceeded",
            details: "Please try again later or contact administrator",
            retryAfter: 60,
          },
          { status: 429 },
        )
      }
      if (message.includes("403") || message.includes("permission")) {
        return NextResponse.json(
          {
            error: "Access denied to configuration spreadsheet",
            details: "Please check your permissions",
          },
          { status: 403 },
        )
      }
      throw e // Re-throw if not a known Google API error
    }
    const fileId = overrideFileId || cfg["CSV_FILE_ID"]

    if (!fileId) return NextResponse.json({ error: "CSV file not configured" }, { status: 400 })

    // Load CSV from cache or fetch
    let cached = csvCache.get(fileId)
    const now = Date.now()
    let data: string[][]
    if (cached && now - cached.ts < CONFIG.CSV_TTL_MS) {
      data = cached.data
    } else {
      try {
        data = await downloadCSVFile(session!.accessToken, fileId)
        csvCache.set(fileId, { data, ts: now })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
          return NextResponse.json(
            {
              error: "Google API quota exceeded",
              details: "CSV download failed due to rate limiting. Please try again later.",
              retryAfter: 60,
            },
            { status: 429 },
          )
        }
        if (message.includes("404") || message.includes("not found")) {
          return NextResponse.json(
            {
              error: "CSV file not found",
              details: `File with ID '${fileId}' does not exist or is not accessible`,
            },
            { status: 404 },
          )
        }
        if (message.includes("403") || message.includes("permission")) {
          return NextResponse.json(
            {
              error: "Access denied to CSV file",
              details: "Please check file permissions and sharing settings",
            },
            { status: 403 },
          )
        }
        throw e // Re-throw if not a known Google API error
      }
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid or empty CSV file" }, { status: 400 })
    }

    // console.log(`Loaded CSV ${fileId} with ${data.length} rows`)
    // console.log("Loaded CSV:", data)

    if (data.length <= 1) {
      return NextResponse.json({ items: [], total: 0, page, pageSize })
    }

    // Validate CSV structure consistency
    const header = data[0]
    if (!header || !Array.isArray(header) || header.length === 0) {
      return NextResponse.json({ error: "CSV header is missing or invalid" }, { status: 400 })
    }

    const headerLength = header.length
    const invalidRows: number[] = []

    // Check each row for consistency
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row)) {
        invalidRows.push(i + 1) // 1-based row numbering for user feedback
        continue
      }

      if (row.length !== headerLength) {
        invalidRows.push(i + 1)
      }
    }

    if (invalidRows.length > 0) {
      const errorMsg =
        invalidRows.length <= 5
          ? `CSV has inconsistent row structure at rows: ${invalidRows.slice(0, 5).join(", ")}`
          : `CSV has inconsistent row structure at ${invalidRows.length} rows (first 5: ${invalidRows.slice(0, 5).join(", ")})`

      return NextResponse.json(
        {
          error: "CSV structure validation failed",
          details: errorMsg,
          invalidRowCount: invalidRows.length,
        },
        { status: 400 },
      )
    }
    let rows = data.slice(1)

    // Exclude rows already worked on by matching CSV ID (first column) with annotation rowIds
    // For dual-language workflow: only exclude if ALL required languages are completed
    const spreadsheetId = cfg["ANNOTATION_SPREADSHEET_ID"]
    if (spreadsheetId) {
      try {
        // Fetch all annotations to analyze completion by language
        const anns = await getAnnotations(session!.accessToken, spreadsheetId)

        // Create a map to track which languages have been translated for each row
        const translationMap = new Map<string, Set<string>>()

        anns.forEach(annotation => {
          const rowId = (annotation.rowId || "").trim()
          if (!rowId) return

          if (!translationMap.has(rowId)) {
            translationMap.set(rowId, new Set())
          }

          const languages = translationMap.get(rowId)!

          // Add the translation language if it exists
          if (annotation.translationLanguage) {
            languages.add(annotation.translationLanguage)
          }

          // For non-English source language tasks, consider them complete once annotated
          // This is determined by checking if the source language is NOT English
          const csvRowData = rows.find(r => (r[0] || "").trim() === rowId)
          if (csvRowData) {
            const sourceLanguage = (csvRowData[4] || "").trim().toLowerCase()
            if (sourceLanguage !== "en" && sourceLanguage !== "english") {
              // For non-English tasks, mark as complete once any annotation exists
              languages.add("completed")
            }
          }
        })

        // Also check the final dataset to ensure we don't re-annotate already completed items
        const finalSpreadsheetId = cfg["FINAL_DATASET_SPREADSHEET_ID"]
        const finalDatasetIds = new Set<string>()
        if (finalSpreadsheetId) {
          try {
            const finalDataset = await getFinalDataset(session!.accessToken, finalSpreadsheetId)
            finalDataset.forEach((item: any) => {
              if (item.id_in_source || item.id) {
                finalDatasetIds.add((item.id_in_source || item.id).toString().trim())
              }
            })
          } catch (finalError) {
            console.warn("Could not fetch final dataset for filtering:", finalError)
          }
        }

        // Filter out rows based on completion status
        rows = rows.filter(row => {
          const rowId = (row[0] || "").trim()
          if (!rowId) return true

          // If already in final dataset, exclude
          if (finalDatasetIds.has(rowId)) return false

          const sourceLanguage = (row[4] || "").trim().toLowerCase()
          const completedLanguages = translationMap.get(rowId) || new Set()

          // For English source tasks, only exclude if BOTH Yoruba and Hausa translations exist
          if (sourceLanguage === "en" || sourceLanguage === "english") {
            return !(completedLanguages.has("yo") && completedLanguages.has("ha"))
          }

          // For non-English tasks, exclude if any annotation exists
          return !completedLanguages.has("completed")
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
          // Log warning but continue without filtering - better to show all tasks than fail completely
          console.warn("Google API quota exceeded when fetching annotations, continuing without filtering")
        } else if (message.includes("404") || message.includes("not found")) {
          console.warn(`Annotation spreadsheet not found: ${spreadsheetId}, continuing without filtering`)
        } else if (message.includes("403") || message.includes("permission")) {
          console.warn(`Access denied to annotation spreadsheet: ${spreadsheetId}, continuing without filtering`)
        } else {
          // For other errors, we can still continue but log the issue
          console.error("Error fetching annotations:", message)
        }
        // Continue without filtering - it's better to show potentially duplicate tasks than to fail
      }
    }

    const total = rows.length
    const start = (page - 1) * pageSize
    const end = Math.min(start + pageSize, total)
    const pageRows = rows.slice(start, end)

    // Provide normalized objects for UI
    const items = pageRows.map((row, idx) => ({
      index: start + idx + 1, // original index starting from 1 after header
      data: row,
      header,
    }))

    return NextResponse.json({ items, total, page, pageSize })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Failed to list tasks", details: message }, { status: 500 })
  }
}
