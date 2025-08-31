import { type NextRequest, NextResponse } from "next/server"
import { downloadCSVFile } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

// Route handler for fetching a CSV file from Google Drive by fileId
export async function GET(request: NextRequest, context: { params: { fileId: string } }) {
  const limited = await enforceRateLimit(request, { route: "drive:csv:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const fileId = context?.params?.fileId
    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID provided" }, { status: 400 })
    }

    const csvData = await downloadCSVFile(session!.accessToken, fileId)

    if (!csvData || csvData.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 })
    }

    return NextResponse.json({
      data: csvData,
      rowCount: csvData.length,
      columnCount: csvData[0]?.length || 0,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      {
        error: "Failed to download CSV file",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
