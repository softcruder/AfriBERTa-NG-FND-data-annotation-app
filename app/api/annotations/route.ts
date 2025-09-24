import { type NextRequest, NextResponse } from "next/server"
import {
  logAnnotation,
  getAnnotations,
  updatePaymentFormulas,
  initializeGoogleAPIs,
  appendFinalDatasetRow,
  getAppConfig,
  type AnnotationRow,
} from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    let annotations = await getAnnotations(session!.accessToken, spreadsheetId)

    // Hide QA-passed (verified) annotations from non-admin users
    if (session!.user.role !== "admin") {
      annotations = annotations.filter(a => a.status !== "verified" && !a.verifiedBy)
    }

    // Exclude annotations made by current user to maintain peer review integrity
    // Current user should not be able to QA their own annotations
    annotations = annotations.filter(a => a.annotatorId !== session!.user.id)

    return NextResponse.json({ annotations })
  } catch (error) {
    console.error("Error getting annotations:", error)
    return NextResponse.json({ error: "Failed to get annotations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:POST" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { spreadsheetId, annotation } = await request.json()

    if (!spreadsheetId || !annotation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Basic validation of critical fields
    if (!annotation.rowId || !annotation.annotatorId) {
      return NextResponse.json(
        { error: "Invalid annotation payload", details: "rowId and annotatorId are required" },
        { status: 400 },
      )
    }

    // Defensive trimming
    annotation.rowId = (annotation.rowId || "").trim()
    annotation.annotatorId = (annotation.annotatorId || "").trim()

    // Ensure annotator can only log their own annotations
    if (session!.user.role === "annotator" && annotation.annotatorId !== session!.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Deduplication: prevent duplicate entries by Row ID or overlapping source links
    // Normalize helper for URLs/links
    const normalize = (s: string) =>
      (s || "")
        .trim()
        .toLowerCase()
        .replace(/\/+$/, "") // drop trailing slashes
        .replace(/^https?:\/\//, "") // ignore scheme

    try {
      const existing = await getAnnotations(session!.accessToken, spreadsheetId)
      const newRowId = (annotation.rowId || "").trim()
      const newOriginalLang = (annotation.originalLanguage || "").trim().toLowerCase()
      // Infer target translation language for this submission (if any)
      const newLang: "ha" | "yo" | undefined = ((): any => {
        const tl = (annotation.translationLanguage || "").toString().trim().toLowerCase()
        if (tl === "ha" || tl === "yo") return tl
        // Heuristic fallbacks if translationLanguage not explicitly set
        if (annotation.claim_text_ha || annotation.article_body_ha) return "ha"
        if (annotation.claim_text_yo || annotation.article_body_yo) return "yo"
        return undefined
      })()

      // Build a set of normalized links for the new annotation
      const newLinks = new Set<string>()
      ;[annotation.sourceUrl || "", ...(annotation.sourceLinks || []), ...(annotation.claimLinks || [])]
        .map(normalize)
        .filter(Boolean)
        .forEach(l => newLinks.add(l))

      // Check for duplicates with per-language allowance for EN source tasks
      const dup = existing.find((row: AnnotationRow) => {
        const rowId = (row.rowId || "").trim()
        const sameRow = newRowId && rowId === newRowId
        if (sameRow) {
          const rowOrig = (row.originalLanguage || "").trim().toLowerCase()
          const isEnglishTask = (newOriginalLang || rowOrig) === "en" || (newOriginalLang || rowOrig) === "english"
          if (isEnglishTask) {
            // Allow multiple entries for the same Row ID as long as they target different languages
            if (newLang === "ha") {
              const rowHasHA = Boolean(
                (row.translator_ha_id && row.translator_ha_id.trim()) ||
                  row.claim_text_ha ||
                  row.article_body_ha ||
                  row.translationLanguage === "ha",
              )
              return rowHasHA // duplicate only if HA already recorded for this Row ID
            }
            if (newLang === "yo") {
              const rowHasYO = Boolean(
                (row.translator_yo_id && row.translator_yo_id.trim()) ||
                  row.claim_text_yo ||
                  row.article_body_yo ||
                  row.translationLanguage === "yo",
              )
              return rowHasYO // duplicate only if YO already recorded for this Row ID
            }
            // If we can't determine the target language, be conservative and treat as duplicate
            return true
          }
          // Non-EN original tasks: keep strict single entry per Row ID
          return true
        }

        // For different Row IDs, treat overlapping links as duplicates (original behavior)
        const rowLinks = new Set<string>()
        ;[row.sourceUrl || "", ...(row.sourceLinks || []), ...(row.claimLinks || [])]
          .map(normalize)
          .filter(Boolean)
          .forEach(l => rowLinks.add(l))
        for (const l of newLinks) if (rowLinks.has(l)) return true
        return false
      })

      if (dup) {
        return NextResponse.json(
          {
            error: "Duplicate annotation",
            details:
              "An annotation with the same Row ID or overlapping source links already exists for this language. For English tasks, only one HA and one YO entry are allowed per Row ID.",
          },
          { status: 409 },
        )
      }
    } catch (e) {
      // If dedup check fails unexpectedly, surface a friendly error instead of risking duplicates
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Failed to validate duplicates", details: message }, { status: 500 })
    }

    // Preflight: verify the current user has edit access to the spreadsheet
    try {
      const { drive } = initializeGoogleAPIs(session!.accessToken)
      const file = await drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
      const canEdit = (file.data as any)?.capabilities?.canEdit
      if (!canEdit) {
        return NextResponse.json(
          {
            error: "No edit permission on spreadsheet",
            details:
              "Your Google account doesn't have editor access to this sheet. Ask the owner to share it with you as an editor, or select a sheet you own in Data Configuration.",
          },
          { status: 403 },
        )
      }
    } catch (e) {
      // If capability check fails (e.g., file not found), surface message
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Spreadsheet access check failed", details: message }, { status: 403 })
    }

    await logAnnotation(session!.accessToken, spreadsheetId, annotation)

    // Note: Final dataset entries are now created during QA approval process
    // This ensures only verified annotations make it to the final dataset

    // Update payment formulas after logging annotation; don't block success if this fails
    try {
      await updatePaymentFormulas(session!.accessToken, spreadsheetId)
      return NextResponse.json({ success: true })
    } catch (e) {
      console.warn("Payment formula update failed:", e)
      return NextResponse.json({ success: true, warning: "Annotation saved, but payment formulas not updated." })
    }
  } catch (error) {
    console.error("Error logging annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log annotation", details: message }, { status: 500 })
  }
}
