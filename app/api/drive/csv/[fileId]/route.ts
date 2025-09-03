import { type NextRequest, NextResponse } from "next/server"
import { downloadCSVFile } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

// Route handler for fetching a CSV file from Google Drive by fileId
export async function GET(
  request: NextRequest,
  context: { params: { fileId?: string } | Promise<{ fileId?: string }> },
) {
  const limited = await enforceRateLimit(request, { route: "drive:csv:GET" })
  if (limited) return limited

  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const maybePromise = context.params as any
    const resolvedParams: { fileId?: string } =
      maybePromise && typeof maybePromise.then === "function" ? await maybePromise : maybePromise
    const { fileId } = resolvedParams

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID provided" }, { status: 400 })
    }

    console.log(`API: Attempting to download CSV file ${fileId}`)

    // Add more specific error handling for the googleapis issue
    let csvData: string[][]
    try {
      csvData = await downloadCSVFile(session!.accessToken, fileId)
    } catch (downloadError) {
      console.error(`API: Failed to download CSV file ${fileId}:`, downloadError)

      // Check if it's the specific webpack/googleapis error
      if (downloadError instanceof Error && downloadError.message.includes("Cannot read properties of undefined")) {
        return NextResponse.json(
          {
            error: "Internal server error - Google APIs module loading issue",
            details: "There's a server configuration issue with the Google APIs. Please restart the server.",
            suggestion: "Try refreshing the page or contact support if the issue persists.",
          },
          { status: 500 },
        )
      }

      throw downloadError
    }

    if (!csvData || csvData.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 })
    }

    console.log(`API: Successfully processed CSV file ${fileId} with ${csvData.length} rows`)

    return NextResponse.json({
      data: csvData,
      rowCount: csvData.length,
      columnCount: csvData[0]?.length || 0,
    })
  } catch (error) {
    console.error(`API: Unexpected error in CSV download:`, error)
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
