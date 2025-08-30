import { type NextRequest, NextResponse } from "next/server"
import { downloadCSVFile } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get("auth_session")
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = getSessionFromCookie(sessionCookie.value)
    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

  const { fileId } = await params

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID provided" }, { status: 400 })
    }

    const csvData = await downloadCSVFile(session.accessToken, fileId)

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
