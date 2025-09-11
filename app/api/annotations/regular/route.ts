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
  const limited = await enforceRateLimit(request, { route: "annotations:regular:POST" })
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

    // Ensure annotator can only log their own annotations
    if (session!.user.role === "annotator" && annotation.annotatorId !== session!.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Preflight: verify edit access
    try {
      const { drive } = initializeGoogleAPIs(session!.accessToken)
      const file = await drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
      const canEdit = (file.data as any)?.capabilities?.canEdit
      if (!canEdit) return NextResponse.json({ error: "No edit permission on spreadsheet" }, { status: 403 })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Spreadsheet access check failed", details: message }, { status: 403 })
    }

    // Dedup by rowId/links
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

    // Derive language-specific fields for regular (non-EN source)
    const originalLanguage = (annotation.originalLanguage || "").toLowerCase()
    const claimTextCombined = annotation.claimText || ""
    if (originalLanguage === "ha") {
      annotation.claim_text_ha = annotation.claim_text_ha ?? claimTextCombined
      annotation.article_body_ha = annotation.article_body_ha ?? (annotation as any).articleBody ?? ""
    } else if (originalLanguage === "yo") {
      annotation.claim_text_yo = annotation.claim_text_yo ?? claimTextCombined
      annotation.article_body_yo = annotation.article_body_yo ?? (annotation as any).articleBody ?? ""
    }

    // Track translation flag and original language
    ;(annotation as any).requiresTranslation = false
    annotation.originalLanguage = annotation.originalLanguage || originalLanguage

    await logAnnotation(session!.accessToken, spreadsheetId, annotation as AnnotationRow)

    try {
      await updatePaymentFormulas(session!.accessToken, spreadsheetId)
      return NextResponse.json({ success: true })
    } catch (e) {
      return NextResponse.json({ success: true, warning: "Annotation saved, but payment formulas not updated." })
    }
  } catch (error) {
    console.error("Error logging regular annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log regular annotation", details: message }, { status: 500 })
  }
}
