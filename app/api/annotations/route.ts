import { type NextRequest, NextResponse } from "next/server"
import {
  logAnnotation,
  getAnnotations,
  updatePaymentFormulas,
  initializeGoogleAPIs,
  appendFinalDatasetRow,
  getAppConfig,
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
      // Build a set of normalized links for the new annotation
      const newLinks = new Set<string>()
      ;[annotation.sourceUrl || "", ...(annotation.sourceLinks || []), ...(annotation.claimLinks || [])]
        .map(normalize)
        .filter(Boolean)
        .forEach(l => newLinks.add(l))

      // Check for duplicates
      const dup = existing.find(row => {
        if ((row.rowId || "").trim() === newRowId && newRowId) return true
        const rowLinks = new Set<string>()
        ;[row.sourceUrl || "", ...(row.sourceLinks || []), ...(row.claimLinks || [])]
          .map(normalize)
          .filter(Boolean)
          .forEach(l => rowLinks.add(l))
        // any intersection?
        for (const l of newLinks) if (rowLinks.has(l)) return true
        return false
      })

      if (dup) {
        return NextResponse.json(
          {
            error: "Duplicate annotation",
            details:
              "An annotation with the same Row ID or overlapping source links already exists. Please refresh the page before submitting.",
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

    // Also append to final dataset if configured
    try {
      const cfg = await getAppConfig(session!.accessToken)
      const finalSheet = cfg["FINAL_DATASET_SPREADSHEET_ID"]
      if (finalSheet) {
        // Build merged row: original fields are not available server-side here unless carried in payload.
        // We'll include annotation fields; clients may include CSV fields in annotation.claimText etc.
        const merged: (string | number)[] = [
          annotation.rowId,
          annotation.claimText,
          (annotation.sourceLinks || []).join("; "),
          annotation.translation || "",
          annotation.verdict || "",
          annotation.sourceUrl || "",
          (annotation.claimLinks || []).join("; "),
          annotation.translationLanguage || "",
          annotation.startTime,
          annotation.endTime || "",
          annotation.durationMinutes ?? "",
          annotation.annotatorId,
          annotation.status,
          annotation.verifiedBy || "",
        ]
        await appendFinalDatasetRow(session!.accessToken, finalSheet, merged)
      }
    } catch (e) {
      // Don't block response if final dataset append fails
      //console.warn("Final dataset append failed:", e)
    }

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
