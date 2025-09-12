import { type NextRequest, NextResponse } from "next/server"
import { downloadCSVFile, initializeGoogleAPIs } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

// Lightweight module-level cache (separate from tasks route cache to allow direct endpoint usage)
const CSV_CACHE_TTL_MS = 30_000
const localCsvCache = new Map<string, { data: string[][]; ts: number }>()

// Route handler for fetching a CSV file from Google Drive by fileId
export async function GET(request: NextRequest, context: { params: Promise<{ fileId?: string }> }) {
  const limited = await enforceRateLimit(request, { route: "drive:csv:GET" })
  if (limited) return limited

  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { params: maybePromise } = (await context) as any
    const resolvedParams: { fileId?: string } =
      maybePromise && typeof maybePromise.then === "function" ? await maybePromise : maybePromise
    const { fileId } = resolvedParams

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID provided" }, { status: 400 })
    }

    console.log(`API: Attempting to download CSV file ${fileId}`)

    let csvData: string[][]
    const cached = localCsvCache.get(fileId)
    const now = Date.now()
    if (cached && now - cached.ts < CSV_CACHE_TTL_MS) {
      csvData = cached.data
      console.log(`API: CSV cache hit for ${fileId}`)
    } else {
      // Prime google client cache explicitly (even though downloadCSVFile will call init again) to log reuse
      initializeGoogleAPIs(session!.accessToken, { reuse: true, logPerf: info => console.log(JSON.stringify(info)) })
      try {
        csvData = await downloadCSVFile(session!.accessToken, fileId)
        localCsvCache.set(fileId, { data: csvData, ts: now })
      } catch (downloadError) {
        console.error(`API: Failed to download CSV file ${fileId}:`, downloadError)
        if (
          downloadError instanceof Error &&
          downloadError.name === "TypeError" &&
          ((downloadError.stack && downloadError.stack.includes("undefined")) ||
            (downloadError.message && downloadError.message.includes("undefined")))
        ) {
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
