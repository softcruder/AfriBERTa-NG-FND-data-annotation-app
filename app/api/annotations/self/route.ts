import { type NextRequest, NextResponse } from "next/server"
import { getAnnotations } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

// Returns ONLY the current user's annotations (all statuses) so they can view metrics & history.
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:self:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    const all = await getAnnotations(session!.accessToken, spreadsheetId)
    const mine = all.filter(a => a.annotatorId === session!.user.id)

    return NextResponse.json({ annotations: mine })
  } catch (error) {
    console.error("Error getting self annotations:", error)
    return NextResponse.json({ error: "Failed to get self annotations" }, { status: 500 })
  }
}
