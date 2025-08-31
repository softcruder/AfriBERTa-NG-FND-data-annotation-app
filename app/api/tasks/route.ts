import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { downloadCSVFile, getAppConfig, getAnnotations } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

/**
 * List available tasks (rows) from the configured source CSV with pagination.
 * Query params:
 * - page: number (1-based)
 * - pageSize: number (default 10, max 100)
 * - fileId: optional override the CSV file id; if missing, use config[CSV_FILE_ID]
 */
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "tasks:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "5")))
    const overrideFileId = searchParams.get("fileId") || undefined

    let fileId = overrideFileId
    if (!fileId) {
      const cfg = await getAppConfig(session!.accessToken)
      fileId = cfg["CSV_FILE_ID"]
    }

    if (!fileId) return NextResponse.json({ error: "CSV file not configured" }, { status: 400 })

    const data = await downloadCSVFile(session!.accessToken, fileId)
    if (!data || data.length <= 1) {
      return NextResponse.json({ items: [], total: 0, page, pageSize })
    }

    const header = data[0]
    let rows = data.slice(1)

    // Exclude rows already worked on (based on Annotations_Log rowId pattern `${fileId}_row_${index}`)
    const cfg = await getAppConfig(session!.accessToken)
    const spreadsheetId = cfg["ANNOTATION_SPREADSHEET_ID"]
    if (spreadsheetId) {
      const anns = await getAnnotations(session!.accessToken, spreadsheetId)
      const doneRowIds = new Set((anns || []).map(a => a.rowId))
      rows = rows.filter((_, idx) => !doneRowIds.has(`${fileId}_row_${idx + 1}`))
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
