import { type NextRequest, NextResponse } from "next/server"
import {
  logAnnotation,
  getAnnotations,
  updatePaymentFormulas,
  initializeGoogleAPIs,
  type AnnotationRow,
} from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:translation:POST" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { spreadsheetId, annotation } = (await request.json()) as {
      spreadsheetId?: string
      annotation?: Partial<AnnotationRow> & Record<string, any>
    }

    if (!spreadsheetId || !annotation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Require essential IDs
    if (!annotation.rowId || !annotation.annotatorId) {
      return NextResponse.json(
        { error: "Invalid annotation payload", details: "rowId and annotatorId are required" },
        { status: 400 },
      )
    }

    // Enforce self-submission
    if (session!.user.role === "annotator" && annotation.annotatorId !== session!.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Preflight: verify edit access to the spreadsheet
    try {
      const { drive } = initializeGoogleAPIs(session!.accessToken)
      const file = await drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
      const canEdit = (file.data as any)?.capabilities?.canEdit
      if (!canEdit) return NextResponse.json({ error: "No edit permission on spreadsheet" }, { status: 403 })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Spreadsheet access check failed", details: message }, { status: 403 })
    }

    // Deduplicate by rowId + links
    const normalize = (s: string) =>
      (s || "")
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "")
        .replace(/^https?:\/\//, "")
    const existing = await getAnnotations(session!.accessToken, spreadsheetId)
    const newRowId = (annotation.rowId || "").trim()
    const newLinks = new Set<string>()
    ;[annotation.sourceUrl || "", ...(annotation.sourceLinks || []), ...(annotation.claimLinks || [])]
      .map(normalize)
      .filter(Boolean)
      .forEach(l => newLinks.add(l))
    const dup = existing.find(row => {
      if (newRowId && (row.rowId || "").trim() === newRowId) return true
      const rowLinks = new Set<string>()
      ;[row.sourceUrl || "", ...(row.sourceLinks || []), ...(row.claimLinks || [])]
        .map(normalize)
        .filter(Boolean)
        .forEach(l => rowLinks.add(l))
      for (const l of newLinks) if (rowLinks.has(l)) return true
      return false
    })
    if (dup) return NextResponse.json({ error: "Duplicate annotation" }, { status: 409 })

    // Mark translation tracking fields
    const originalLanguage = (annotation.originalLanguage || "en").toLowerCase()
    annotation.originalLanguage = originalLanguage
    ;(annotation as any).requiresTranslation = true

    // Auto-set translator IDs based on provided language(s)
    const lang = (annotation.translationLanguage || "").toString().toLowerCase()
    if ((annotation as any).isDualTranslator) {
      // dual translator - same user for both
      annotation.translator_ha_id = session!.user.id
      annotation.translator_yo_id = session!.user.id
    } else if (lang === "ha") {
      annotation.translator_ha_id = session!.user.id
    } else if (lang === "yo") {
      annotation.translator_yo_id = session!.user.id
    }

    await logAnnotation(session!.accessToken, spreadsheetId, annotation as AnnotationRow)

    try {
      await updatePaymentFormulas(session!.accessToken, spreadsheetId)
      return NextResponse.json({ success: true })
    } catch (e) {
      return NextResponse.json({ success: true, warning: "Annotation saved, but payment formulas not updated." })
    }
  } catch (error) {
    console.error("Error logging translation annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log translation annotation", details: message }, { status: 500 })
  }
}
