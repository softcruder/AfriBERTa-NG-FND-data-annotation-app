import { type NextRequest, NextResponse } from "next/server"
import { logAnnotation, updatePaymentFormulas, initializeGoogleAPIs, type AnnotationRow } from "@/lib/google-apis"
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

export async function POST(request: NextRequest) {
  const tStart = now()
  const limited = await enforceRateLimit(request, { route: "annotations:translation:POST" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response
    const { spreadsheetId, annotation, forceFormulaUpdate, debugPerf } = (await request.json()) as {
      spreadsheetId?: string
      annotation?: Partial<AnnotationRow> & Record<string, any>
      forceFormulaUpdate?: boolean
      debugPerf?: boolean
    }
    if (!spreadsheetId || !annotation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!annotation.rowId || !annotation.annotatorId) {
      return NextResponse.json(
        { error: "Invalid annotation payload", details: "rowId and annotatorId are required" },
        { status: 400 },
      )
    }

    if (session!.user.role === "annotator" && annotation.annotatorId !== session!.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { drive, sheets } = initializeGoogleAPIs(session!.accessToken)
    const permPromise = drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
    // Fetch only row IDs for dedup (cached)
    const idsPromise = (async () => {
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
    })()
    const [file, existingIds] = await Promise.all([permPromise, idsPromise])
    logPerf("prechecks_complete", tStart, { row_count: existingIds.size })
    const canEdit = (file.data as any)?.capabilities?.canEdit
    if (!canEdit) return NextResponse.json({ error: "No edit permission on spreadsheet" }, { status: 403 })

    if (isRowIdDuplicate(annotation.rowId, existingIds)) {
      return NextResponse.json({ error: "Duplicate annotation (rowId)" }, { status: 409 })
    }

    // Translation-specific semantics
    const originalLanguage = (annotation.originalLanguage || "en").toLowerCase()
    annotation.originalLanguage = originalLanguage
    ;(annotation as any).requiresTranslation = true
    const lang = (annotation.translationLanguage || "").toString().toLowerCase()
    if ((annotation as any).isDualTranslator) {
      annotation.translator_ha_id = session!.user.id
      annotation.translator_yo_id = session!.user.id
    } else if (lang === "ha") {
      annotation.translator_ha_id = session!.user.id
    } else if (lang === "yo") {
      annotation.translator_yo_id = session!.user.id
    }

    const tBeforeLog = now()
    await logAnnotation(session!.accessToken, spreadsheetId, annotation as AnnotationRow)
    logPerf("append_done", tBeforeLog)
    appendRowIdToCache(spreadsheetId, annotation.rowId)

    // Formula update handling
    let formulasUpdated = false
    let formulaMode: string = "background"
    if (forceFormulaUpdate) {
      const tForm = now()
      try {
        await updatePaymentFormulas(session!.accessToken, spreadsheetId)
        formulasUpdated = true
        formulaMode = "immediate"
        logPerf("formulas_immediate", tForm)
      } catch (e) {
        console.warn("[translation] immediate formula update failed", e)
      }
    } else {
      enqueueFormulaUpdate(spreadsheetId, session!.accessToken)
    }

    const totalMs = now() - tStart
    logPerf("request_complete", tStart, { total_ms: totalMs, formulaMode })
    const perfPayload = { totalMs }
    return NextResponse.json({ success: true, formulasUpdated, formulaMode, perf: debugPerf ? perfPayload : undefined })
  } catch (error) {
    console.error("Error logging translation annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log translation annotation", details: message }, { status: 500 })
  }
}
