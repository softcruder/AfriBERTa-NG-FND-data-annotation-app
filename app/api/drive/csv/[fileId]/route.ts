import { type NextRequest, NextResponse } from "next/server"
import { downloadCSVFile } from "@/lib/google-apis"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get("auth_session")
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    if (Date.now() > session.expiresAt) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    const { fileId } = params
    const csvData = await downloadCSVFile(session.accessToken, fileId)

    return NextResponse.json({ data: csvData })
  } catch (error) {
    console.error("Error downloading CSV file:", error)
    return NextResponse.json({ error: "Failed to download CSV file" }, { status: 500 })
  }
}
