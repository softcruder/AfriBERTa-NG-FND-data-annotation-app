import { type NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { exportConfigSchema } from "@/lib/validation"
import { enforceRateLimit } from "@/lib/rate-limit"
import { getFinalDataset, getAppConfig } from "@/lib/google-apis"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "export:POST", limit: 2, windowMs: 3000 })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response

    const body = await request.json()
    const config = exportConfigSchema.parse(body)

    // Get the final dataset spreadsheet ID from config
    const cfg = await getAppConfig(session!.accessToken)
    const finalDatasetSpreadsheetId = cfg["FINAL_DATASET_SPREADSHEET_ID"]

    if (!finalDatasetSpreadsheetId) {
      return NextResponse.json({ error: "Final dataset spreadsheet not configured" }, { status: 400 })
    }

    // Fetch the final dataset
    const finalDataset = await getFinalDataset(session!.accessToken, finalDatasetSpreadsheetId)

    // Build export data with proper structure
    const exportData = {
      annotations: finalDataset,
      summary: {
        totalAnnotations: finalDataset.length,
        totalTimeSpent: 0, // Could be calculated if we track this
        totalPayment: config.includePayments ? 0 : undefined,
      },
    }

    // Format data based on requested format
    let responseData: any
    let contentType: string
    let filename: string

    switch (config.format) {
      case "csv":
        responseData = convertToCSV(exportData)
        contentType = "text/csv"
        filename = "annotations.csv"
        break
      case "json":
        responseData = JSON.stringify(exportData, null, 2)
        contentType = "application/json"
        filename = "annotations.json"
        break
      case "xlsx":
        // In production, use a library like xlsx to create Excel files
        responseData = JSON.stringify(exportData, null, 2)
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "annotations.xlsx"
        break
      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }

    return new NextResponse(responseData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    // console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function convertToCSV(data: any): string {
  // Required CSV fields: [id, claim, label, language, reasoning, sources, claim_source, domain, id_in_source]
  const headers = ["id", "claim", "label", "language", "reasoning", "sources", "claim_source", "domain", "id_in_source"]

  const rows = data.annotations.map((annotation: any) => {
    return [
      annotation.id || "",
      `"${(annotation.claim || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
      annotation.label || "",
      annotation.language || "",
      `"${(annotation.reasoning || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
      `"${(annotation.sources || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
      annotation.claim_source || "",
      annotation.domain || "",
      annotation.id_in_source || "",
    ]
  })

  // If no annotations, add a note
  if (data.annotations.length === 0) {
    rows.push(["No data available", ...Array(headers.length - 1).fill("")])
  }

  return [headers, ...rows].map(row => row.join(",")).join("\n")
}
