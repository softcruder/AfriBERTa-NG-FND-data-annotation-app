import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { z } from "zod"

const AdminVerifySchema = z.object({
  spreadsheetId: z.string(),
  rowId: z.string(),
  action: z.enum(["approve", "needs-revision", "mark-invalid"]),
  comments: z.string().optional(),
  invalidityReason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Dynamic import so that test mocks (vitest) always take effect regardless of import order
    const {
      updateAnnotationStatus,
      getAnnotations,
      getAppConfig,
      downloadCSVFile,
      updatePaymentFormulas,
      finalDatasetHasId,
      createFinalDatasetEntries,
    } = await import("@/lib/google-apis")

    const body = await request.json()
    const { spreadsheetId, rowId, action, comments, invalidityReason } = AdminVerifySchema.parse(body)

    let message: string
    if (action === "approve") {
      // Admin approval here is treated as final verification and dataset finalization
      await updateAnnotationStatus(session.accessToken, spreadsheetId, rowId, {
        status: "verified" as any,
        adminComments: comments,
      })

      // Fetch latest annotation row to build dataset entries
      try {
        const annotations = await getAnnotations(session.accessToken, spreadsheetId)
        const annotation = annotations.find(a => a.rowId === rowId)
        if (annotation) {
          const cfg = await getAppConfig(session.accessToken).catch(() => ({}) as any)
          const finalSpreadsheetId = cfg["FINAL_DATASET_SPREADSHEET_ID"]
          const csvFileId = cfg["CSV_FILE_ID"]
          if (finalSpreadsheetId) {
            const already = await finalDatasetHasId(session.accessToken, finalSpreadsheetId, annotation.rowId)
            if (already) {
              // Skip creating dataset entries if they already exist (id or language variants)
              console.info("Admin verify: final dataset already contains id, skipping append", annotation.rowId)
            } else {
              let originalCsvData: string[] | undefined
              if (csvFileId) {
                try {
                  const csvData = await downloadCSVFile(session.accessToken, csvFileId)
                  originalCsvData = csvData.find(r => (r[0] || "").trim() === annotation.rowId)
                } catch (e) {
                  console.warn("Admin verify: CSV fetch failed during finalization", e)
                }
              }
              try {
                await createFinalDatasetEntries(session.accessToken, finalSpreadsheetId, annotation, originalCsvData)
              } catch (e) {
                console.warn("Admin verify: failed to append final dataset entries", e)
              }
            }
          }
        }
      } catch (finalErr) {
        console.warn("Admin verify finalization error", finalErr)
      }

      // Update payment formulas (non-blocking)
      try {
        await updatePaymentFormulas(session.accessToken, spreadsheetId)
      } catch (payErr) {
        console.warn("Admin verify payment formula update failed", payErr)
      }

      message = "Annotation approved and finalized"
    } else if (action === "needs-revision") {
      await updateAnnotationStatus(session.accessToken, spreadsheetId, rowId, {
        status: "needs-revision" as any,
        adminComments: comments,
      })
      message = "Annotation sent for revision"
    } else if (action === "mark-invalid") {
      await updateAnnotationStatus(session.accessToken, spreadsheetId, rowId, {
        status: "invalid" as any,
        adminComments: comments,
        isValid: false,
        invalidityReason,
      })
      message = "Annotation marked as invalid"
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Admin verify error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
