import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { exportConfigSchema } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const config = exportConfigSchema.parse(body)

    // In production, this would:
    // 1. Query the Google Sheets for annotation data
    // 2. Filter by date range and annotators if specified
    // 3. Include payment and time tracking data if requested
    // 4. Format data according to the specified format
    // 5. Return the formatted data

    // For now, return a basic structure for frontend compatibility
    // This should be implemented to fetch real data from Google Sheets
    const exportData = {
      annotations: [],
      summary: {
        totalAnnotations: 0,
        totalTimeSpent: 0,
        totalPayment: config.includePayments ? 0 : undefined,
      },
      message: "Export functionality requires Google Sheets integration to be fully implemented",
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
  const headers = [
    "ID",
    "Annotator",
    "Row ID",
    "Claims",
    "Source Links",
    "Translation",
    "Start Time",
    "End Time",
    "Time Spent (min)",
  ]

  if (data.annotations[0]?.payment !== undefined) {
    headers.push("Payment ($)")
  }

  const rows = data.annotations.map((annotation: any) => {
    const row = [
      annotation.id || "",
      annotation.annotator || "",
      annotation.rowId || "",
      `"${(annotation.claims || []).join("; ")}"`,
      `"${(annotation.sourceLinks || []).join("; ")}"`,
      `"${annotation.translation || ""}"`,
      annotation.startTime || "",
      annotation.endTime || "",
      annotation.timeSpent || "",
    ]

    if (annotation.payment !== undefined) {
      row.push(annotation.payment.toString())
    }

    return row
  })


  // If no annotations, add a note
  if (data.annotations.length === 0) {
    rows.push(["No data available", ...Array(headers.length - 1).fill("")])
  }

  return [headers, ...rows].map((row) => row.join(",")).join("\n")

}
