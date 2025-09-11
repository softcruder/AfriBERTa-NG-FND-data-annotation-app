import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import {
  updateAnnotationStatus,
  updateAnnotationContent,
  getAnnotations,
  createFinalDatasetEntries,
  getAppConfig,
  downloadCSVFile,
  updatePaymentFormulas,
  finalDatasetHasId,
} from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "qa:verify:POST", limit: 5, windowMs: 3000 })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const { spreadsheetId, rowId, qaComments, isApproved, adminOverride, contentUpdates, adminFinalize } =
      await request.json()
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

    // Apply content edits if provided (allowed for peer QA only if not self and if status not yet qa-approved)
    if (contentUpdates && Object.keys(contentUpdates).length > 0) {
      try {
        await updateAnnotationContent(session!.accessToken, spreadsheetId, rowId, contentUpdates)
      } catch (cuErr) {
        console.warn("Content update failed:", cuErr)
      }
    }

    let newStatus: string
    if (isApproved) {
      newStatus = "qa-approved"
    } else {
      newStatus = "admin-review" // falls back requesting admin review
    }

    // If adminFinalize is true and user is admin and annotation already qa-approved, mark verified + create dataset
    let finalized = false
    if (adminFinalize && session!.user.role === "admin") {
      newStatus = "verified"
      finalized = true
    }

    await updateAnnotationStatus(session!.accessToken, spreadsheetId, rowId, {
      status: newStatus as any,
      verifiedBy: session!.user.email,
      qaComments: qaComments || "",
    })

    // Refresh annotation object if needed for dataset creation
    let freshAnnotation = annotation
    if (finalized) {
      const refreshed = await getAnnotations(session!.accessToken, spreadsheetId)
      const found = refreshed.find(a => a.rowId === rowId)
      if (found) freshAnnotation = found
    }

    // On final admin verification create dataset entries (unique) when transitioning to verified
    if (finalized) {
      try {
        const cfg = await getAppConfig(session!.accessToken)
        const finalSpreadsheetId = cfg["FINAL_DATASET_SPREADSHEET_ID"]
        const csvFileId = cfg["CSV_FILE_ID"]
        if (finalSpreadsheetId) {
          const already = await finalDatasetHasId(session!.accessToken, finalSpreadsheetId, freshAnnotation.rowId)
          if (!already) {
            let originalCsvData: string[] | undefined
            if (csvFileId) {
              try {
                const csvData = await downloadCSVFile(session!.accessToken, csvFileId)
                originalCsvData = csvData.find(row => (row[0] || "").trim() === freshAnnotation.rowId)
              } catch (err) {
                console.warn("CSV fetch failed during finalization", err)
              }
            }
            await createFinalDatasetEntries(session!.accessToken, finalSpreadsheetId, freshAnnotation, originalCsvData)
          }
        }
      } catch (finalErr) {
        console.warn("Final dataset append failed:", finalErr)
      }
    }

    // Update payment formulas to reflect QA activities and approval status changes
    try {
      await updatePaymentFormulas(session!.accessToken, spreadsheetId)
    } catch (paymentError) {
      // Don't fail the verification if payment update fails, but log it
      console.warn("Failed to update payment formulas after QA:", paymentError)
    }

    return NextResponse.json({ success: true, status: newStatus, finalized })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Verification failed", details: message }, { status: 500 })
  }
}
