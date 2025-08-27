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

    // Mock export logic - in real implementation, this would:
    // 1. Query the Google Sheets for annotation data
    // 2. Filter by date range and annotators if specified
    // 3. Include payment and time tracking data if requested
    // 4. Format data according to the specified format
    // 5. Return the formatted data

    const mockData = {
      annotations: [
        {
          id: "1",
          annotator: "john@example.com",
          rowId: "row_1",
          claims: ["Sample claim 1", "Sample claim 2"],
          sourceLinks: ["https://example.com/source1"],
          translation: "Sample translation",
          startTime: "2024-01-15T10:00:00Z",
          endTime: "2024-01-15T10:15:00Z",
          timeSpent: 15,
          payment: config.includePayments ? 5.0 : undefined,
        },
      ],
      summary: {
        totalAnnotations: 1,
        totalTimeSpent: 15,
        totalPayment: config.includePayments ? 5.0 : undefined,
      },
    }

    // Format data based on requested format
    let responseData: any
    let contentType: string
    let filename: string

    switch (config.format) {
      case "csv":
        responseData = convertToCSV(mockData)
        contentType = "text/csv"
        filename = "annotations.csv"
        break
      case "json":
        responseData = JSON.stringify(mockData, null, 2)
        contentType = "application/json"
        filename = "annotations.json"
        break
      case "xlsx":
        // In real implementation, use a library like xlsx to create Excel files
        responseData = JSON.stringify(mockData, null, 2)
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
    console.error("Export error:", error)
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
      annotation.id,
      annotation.annotator,
      annotation.rowId,
      `"${annotation.claims.join("; ")}"`,
      `"${annotation.sourceLinks.join("; ")}"`,
      `"${annotation.translation || ""}"`,
      annotation.startTime,
      annotation.endTime,
      annotation.timeSpent,
    ]

    if (annotation.payment !== undefined) {
      row.push(annotation.payment.toString())
    }

    return row
  })

  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}
