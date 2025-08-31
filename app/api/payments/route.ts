import { type NextRequest, NextResponse } from "next/server"
import { getPaymentSummaries } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "payments:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    const payments = await getPaymentSummaries(session!.accessToken, spreadsheetId)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error getting payment summaries:", error)
    return NextResponse.json({ error: "Failed to get payment summaries" }, { status: 500 })
  }
}
