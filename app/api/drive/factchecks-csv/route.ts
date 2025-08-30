import { type NextRequest, NextResponse } from "next/server"
import { findFactChecksCSV } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "drive:factchecks-csv:GET" })
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

    const fileId = await findFactChecksCSV(session.accessToken)

    return NextResponse.json({ fileId })
  } catch (error) {
    console.error("Error finding factchecks CSV:", error)
    return NextResponse.json({ error: "Failed to find factchecks.csv" }, { status: 500 })
  }
}
