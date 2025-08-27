import { type NextRequest, NextResponse } from "next/server"
import { getPaymentSummaries } from "@/lib/google-apis"

export async function GET(request: NextRequest) {
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

    // Only admins can view payment summaries
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    const payments = await getPaymentSummaries(session.accessToken, spreadsheetId)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error getting payment summaries:", error)
    return NextResponse.json({ error: "Failed to get payment summaries" }, { status: 500 })
  }
}
