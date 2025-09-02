import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import {
  updateAnnotationStatus,
  getAnnotations,
  createFinalDatasetEntries,
  getAppConfig,
  downloadCSVFile,
} from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "qa:verify:POST", limit: 5, windowMs: 3000 })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const { spreadsheetId, rowId, qaComments, isApproved, adminOverride } = await request.json()
    if (!spreadsheetId || !rowId) {
      return NextResponse.json({ error: "spreadsheetId and rowId are required" }, { status: 400 })
    }

    // Get the annotation to check who created it
    const annotations = await getAnnotations(session!.accessToken, spreadsheetId)
    const annotation = annotations.find(a => a.rowId === rowId)

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 })
    }

    // Prevent self-verification unless admin override
    if (annotation.annotatorId === session!.user.id && !adminOverride) {
      return NextResponse.json(
        {
          error: "Self-verification not allowed",
          details: "You cannot perform QA on your own annotation. Please assign to another annotator.",
        },
        { status: 403 },
      )
    }

    // Allow annotators to do peer review QA, admins can always verify
    if (session!.user.role !== "annotator" && session!.user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Insufficient permissions",
          details: "Only annotators (for peer review) and admins can verify annotations.",
        },
        { status: 403 },
      )
    }

    const newStatus = isApproved ? "qa-approved" : "admin-review"

    await updateAnnotationStatus(session!.accessToken, spreadsheetId, rowId, {
      status: newStatus,
      verifiedBy: session!.user.email,
      qaComments: qaComments || "",
    })

    // If approved, create final dataset entries
    if (isApproved) {
      try {
        const cfg = await getAppConfig(session!.accessToken)
        const finalSpreadsheetId = cfg["FINAL_DATASET_SPREADSHEET_ID"]
        const csvFileId = cfg["CSV_FILE_ID"]

        if (finalSpreadsheetId && csvFileId) {
          // Get the original CSV data for additional context
          let originalCsvData: string[] | undefined
          try {
            const csvData = await downloadCSVFile(session!.accessToken, csvFileId)
            // Find the row that matches the annotation rowId
            const matchingRow = csvData.find(row => (row[0] || "").trim() === annotation.rowId)
            originalCsvData = matchingRow
          } catch (csvError) {
            console.warn("Could not fetch original CSV data:", csvError)
          }

          await createFinalDatasetEntries(session!.accessToken, finalSpreadsheetId, annotation, originalCsvData)
        }
      } catch (finalDatasetError) {
        // Don't fail the approval if final dataset creation fails
        console.warn("Failed to create final dataset entries:", finalDatasetError)
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: isApproved ? "Annotation approved" : "Sent to admin for review",
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Verification failed", details: message }, { status: 500 })
  }
}
