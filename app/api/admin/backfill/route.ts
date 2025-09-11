import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import {
  getAnnotations,
  updateAnnotationContent,
  initializeGoogleAPIs,
  ensureAnnotationLogHeaders,
} from "@/lib/google-apis"

/**
 * One-time backfill to populate new tracking columns for existing rows:
 * - Requires_Translation
 * - Original_Language
 * - Translator_HA_ID / Translator_YO_ID
 *
 * Admin only. Provide `spreadsheetId` as query or JSON body.
 */
export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "admin:backfill:POST" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response
  if (session!.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    let spreadsheetId = searchParams.get("spreadsheetId") || undefined
    if (!spreadsheetId) {
      try {
        const body = await request.json().catch(() => ({}))
        spreadsheetId = body.spreadsheetId
      } catch {}
    }
    if (!spreadsheetId) return NextResponse.json({ error: "spreadsheetId required" }, { status: 400 })

    // Quick permission check
    try {
      const { drive } = initializeGoogleAPIs(session!.accessToken)
      const file = await drive.files.get({ fileId: spreadsheetId, fields: "id,capabilities" })
      const canEdit = (file.data as any)?.capabilities?.canEdit
      if (!canEdit) return NextResponse.json({ error: "No edit permission on spreadsheet" }, { status: 403 })
    } catch (e) {
      return NextResponse.json({ error: "Spreadsheet access check failed" }, { status: 403 })
    }

    // Ensure headers first
    await ensureAnnotationLogHeaders(session!.accessToken, spreadsheetId)

    const annotations = await getAnnotations(session!.accessToken, spreadsheetId)

    let updated = 0
    for (const ann of annotations) {
      const rowId = (ann.rowId || "").trim()
      if (!rowId) continue

      // Derive original language from existing fields heuristics
      // If translationLanguage exists -> original is EN; else try to infer from claim_text_* presence else fallback to CSV lang if stored
      let originalLanguage = ann.originalLanguage
      if (!originalLanguage) {
        if (ann.translationLanguage) originalLanguage = "en"
        else if (ann.claim_text_ha || ann.article_body_ha) originalLanguage = "ha"
        else if (ann.claim_text_yo || ann.article_body_yo) originalLanguage = "yo"
      }

      const requiresTranslation = originalLanguage === "en"

      // Translator IDs: if translationLanguage is ha/yo, set corresponding translator id to the annotatorId for historical rows
      let translator_ha_id = ann.translator_ha_id
      let translator_yo_id = ann.translator_yo_id
      if (!translator_ha_id && ann.translationLanguage === "ha") translator_ha_id = ann.annotatorId
      if (!translator_yo_id && ann.translationLanguage === "yo") translator_yo_id = ann.annotatorId

      // If nothing to update, skip
      if (
        ann.originalLanguage === originalLanguage &&
        ann.requiresTranslation === requiresTranslation &&
        ann.translator_ha_id === translator_ha_id &&
        ann.translator_yo_id === translator_yo_id
      )
        continue

      await updateAnnotationContent(session!.accessToken, spreadsheetId, rowId, {
        originalLanguage: originalLanguage || "",
        requiresTranslation: requiresTranslation ? "TRUE" : "",
        translator_ha_id: translator_ha_id || "",
        translator_yo_id: translator_yo_id || "",
      } as any)

      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Backfill failed", details: message }, { status: 500 })
  }
}
