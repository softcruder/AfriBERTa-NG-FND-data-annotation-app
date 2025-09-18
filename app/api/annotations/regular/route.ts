import { type NextRequest, NextResponse } from "next/server"
import {
  updatePaymentFormulas,
  initializeGoogleAPIs,
  type AnnotationRow,
  setFormulaLastUpdate,
} from "@/lib/google-apis"
import {
  logPerf,
  now,
  enqueueFormulaUpdate,
  getCachedRowIds,
  setCachedRowIds,
  appendRowIdToCache,
  isRowIdDuplicate,
} from "@/lib/annotation-route-utils"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

// Local helper logic (restored): optimized for regular annotation ingestion (dedup + minimal client reuse)
// Includes sanitation (line-break removal) and validity handling consistent with global logger.

async function ensureAnnotationLogHeadersWithClient(sheets: any, spreadsheetId: string) {
  const expected = [
    "Row_ID",
    "Annotator_ID",
    "Claim_Text",
    "Source_Links",
    "Translation",
    "Start_Time",
    "End_Time",
    "Duration_Minutes",
    "Status",
    "Verified_By",
    "Verdict",
    "Source_URL",
    "Claim_Links",
    "Claim_Text_HA",
    "Claim_Text_YO",
    "Article_Body_HA",
    "Article_Body_YO",
    "Translation_Language",
    "Requires_Translation",
    "Original_Language",
    "Translator_HA_ID",
    "Translator_YO_ID",
    "Invalidity_Reason",
    "Admin_Comments",
    "QA_Comments",
    "Is_Valid",
  ]
  try {
    const headerResp = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Annotations_Log!A1:Z1" })
    const existing = headerResp.data.values?.[0]
    const needsUpdate = !existing || expected.some((h, i) => existing[i] !== h)
    if (needsUpdate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Annotations_Log!A1:Z1",
        valueInputOption: "RAW",
        requestBody: { values: [expected] },
      })
    }
  } catch (e) {
    console.warn("[regular] header ensure failed (continuing)", e)
  }
}

function sanitizeCell(val: any): string {
  if (val === null || val === undefined) return ""
  if (typeof val === "number") return String(val)
  return String(val)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

async function appendAnnotationWithClient(sheets: any, spreadsheetId: string, annotation: AnnotationRow) {
  await ensureAnnotationLogHeadersWithClient(sheets, spreadsheetId)
  const rowId = sanitizeCell((annotation.rowId || "").trim())
  const annotatorId = sanitizeCell((annotation.annotatorId || "").trim())
  if (!rowId) throw new Error("Annotation rowId is required")
  if (!annotatorId) throw new Error("Annotation annotatorId is required")

  const joinedSourceLinks = sanitizeCell((annotation.sourceLinks || []).filter(Boolean).join("; "))
  const joinedClaimLinks = sanitizeCell((annotation.claimLinks || []).filter(Boolean).join("; "))
  const invalidityReason = sanitizeCell(annotation.invalidityReason || "")
  const isInvalid = annotation.isValid === false || !!invalidityReason

  const values: (string | number)[] = [
    rowId,
    annotatorId,
    sanitizeCell(annotation.claimText || ""),
    joinedSourceLinks,
    sanitizeCell(annotation.translation || ""),
    sanitizeCell(annotation.startTime || new Date().toISOString()),
    sanitizeCell(annotation.endTime || ""),
    annotation.durationMinutes ?? "",
    sanitizeCell(annotation.status || "completed"),
    sanitizeCell(annotation.verifiedBy || ""),
    sanitizeCell(annotation.verdict || ""),
    sanitizeCell(annotation.sourceUrl || ""),
    joinedClaimLinks,
    sanitizeCell(annotation.claim_text_ha || ""),
    sanitizeCell(annotation.claim_text_yo || ""),
    sanitizeCell(annotation.article_body_ha || ""),
    sanitizeCell(annotation.article_body_yo || ""),
    sanitizeCell(annotation.translationLanguage || ""),
    annotation.requiresTranslation ? "TRUE" : "FALSE",
    sanitizeCell((annotation.originalLanguage || "").toLowerCase()),
    sanitizeCell(annotation.translator_ha_id || ""),
    sanitizeCell(annotation.translator_yo_id || ""),
    invalidityReason,
    sanitizeCell(annotation.adminComments || ""),
    sanitizeCell(annotation.qaComments || ""),
    isInvalid ? "false" : "true",
    sanitizeCell(annotation.qaOriginalSnapshot || ""),
    sanitizeCell(annotation.qaEditedSnapshot || ""),
    sanitizeCell(annotation.qaFieldDiff || ""),
    sanitizeCell(annotation.adminFinalSnapshot || ""),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Annotations_Log",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  })
}

// Lightweight dedup fetch: limit to necessary columns (A:M covers needed columns without translation extras after M)
async function fetchRowIds(sheets: any, spreadsheetId: string): Promise<Set<string>> {
  const cached = getCachedRowIds(spreadsheetId)
  if (cached) return cached
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Annotations_Log!A:A" })
  const rows = resp.data.values || []
  const ids = new Set<string>()
  rows.slice(1).forEach((r: string[]) => {
    const id = (r[0] || "").trim()
    if (id) ids.add(id)
  })
  setCachedRowIds(spreadsheetId, ids)
  return ids
}

export async function POST(request: NextRequest) {
  const tStart = now()
  const limited = await enforceRateLimit(request, { route: "annotations:regular:POST" })
  if (limited) return limited
  const tRate = now()
  logPerf("rate_limit", tStart, { ms_from_start: tRate - tStart })
  try {
    const { response, session } = await requireSession(request)
    if (response) return response
    const tSession = now()
    logPerf("session_ok", tSession, { ms_from_start: tSession - tStart })

    const { spreadsheetId, annotation, forceFormulaUpdate, debugPerf } = (await request.json()) as {
      spreadsheetId?: string
      annotation?: Partial<AnnotationRow> & Record<string, any>
      forceFormulaUpdate?: boolean
      debugPerf?: boolean
    }
    if (!spreadsheetId || !annotation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (session!.user.role === "annotator" && annotation.annotatorId !== session!.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { drive, sheets } = initializeGoogleAPIs(session!.accessToken, {
      reuse: true,
      logPerf: info => console.log(JSON.stringify(info)),
    })
    const permPromise = drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
    const idsPromise = fetchRowIds(sheets, spreadsheetId)
    const [file, existingIds] = await Promise.all([permPromise, idsPromise])
    const tPre = now()
    logPerf("prechecks_complete", tPre, { row_count: existingIds.size })

    const canEdit = (file.data as any)?.capabilities?.canEdit
    if (!canEdit) return NextResponse.json({ error: "No edit permission on spreadsheet" }, { status: 403 })

    if (isRowIdDuplicate((annotation as AnnotationRow).rowId || "", existingIds)) {
      return NextResponse.json({ error: "Duplicate annotation (rowId)" }, { status: 409 })
    }

    // Language-specific derivations
    const originalLanguage = (annotation.originalLanguage || "").toLowerCase()
    const claimTextCombined = annotation.claimText || ""
    if (originalLanguage === "ha") {
      annotation.claim_text_ha = annotation.claim_text_ha ?? claimTextCombined
      annotation.article_body_ha = annotation.article_body_ha ?? (annotation as any).articleBody ?? ""
    } else if (originalLanguage === "yo") {
      annotation.claim_text_yo = annotation.claim_text_yo ?? claimTextCombined
      annotation.article_body_yo = annotation.article_body_yo ?? (annotation as any).articleBody ?? ""
    }
    ;(annotation as any).requiresTranslation = false
    annotation.originalLanguage = annotation.originalLanguage || originalLanguage

    const tBeforeAppend = now()
    await appendAnnotationWithClient(sheets, spreadsheetId, annotation as AnnotationRow)
    logPerf("append_done", tBeforeAppend)

    // Update cache with new rowId
    appendRowIdToCache(spreadsheetId, (annotation as AnnotationRow).rowId)

    // Background or forced immediate formula update
    let formulasUpdated = false
    let formulaMode: string = "background"
    if (forceFormulaUpdate) {
      const tForm = now()
      try {
        await updatePaymentFormulas(session!.accessToken, spreadsheetId)
        // Persist timestamp (fire and forget)
        setFormulaLastUpdate(session!.accessToken, spreadsheetId).catch(err =>
          console.warn("[regular] failed to persist formula timestamp", err),
        )
        formulasUpdated = true
        formulaMode = "immediate"
        logPerf("formulas_immediate", tForm)
      } catch (e) {
        console.warn("[regular] immediate formula update failed", e)
      }
    } else {
      enqueueFormulaUpdate(spreadsheetId, session!.accessToken)
    }

    const totalMs = now() - tStart
    const perfPayload = { totalMs }
    logPerf("request_complete", tStart, { total_ms: totalMs, formulaMode })
    return NextResponse.json({ success: true, formulasUpdated, formulaMode, perf: debugPerf ? perfPayload : undefined })
  } catch (error) {
    console.error("Error logging regular annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log regular annotation", details: message }, { status: 500 })
  }
}
