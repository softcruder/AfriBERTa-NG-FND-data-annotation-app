import { type NextRequest, NextResponse } from "next/server"
import { getPaymentSummaries } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "payments:GET" })
  if (limited) return limited
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
