import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import { getAnnotations } from "@/lib/google-apis"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:GET:paginated", limit: 20, windowMs: 3000 })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")
    const page = Number(searchParams.get("page") || 1)
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 20)))

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    let all = await getAnnotations(session!.accessToken, spreadsheetId)

    // Restrict for non-admins: hide verified and self-authored rows
    if (session!.user.role !== "admin") {
      all = all.filter(a => a.status !== "verified" && !a.verifiedBy)
    }
    all = all.filter(a => a.annotatorId !== session!.user.id)

    // Pending list use-case primarily: unverified or QA/admin review
    const sorted = all.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(Math.max(1, page), totalPages)
    const start = (current - 1) * pageSize
    const end = start + pageSize
    const items = sorted.slice(start, end)

    return NextResponse.json({ items, page: current, pageSize, total, totalPages })
  } catch (error) {
    console.error("Error getting paginated annotations:", error)
    return NextResponse.json({ error: "Failed to get annotations" }, { status: 500 })
  }
}
