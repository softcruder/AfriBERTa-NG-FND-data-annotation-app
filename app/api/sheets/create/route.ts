import { type NextRequest, NextResponse } from "next/server"
import { createAnnotationSheet } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "sheets:create:POST", limit: 2, windowMs: 3000 })
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

    // Only admins can create annotation sheets
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { title } = await request.json()
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const spreadsheetId = await createAnnotationSheet(session.accessToken, title)

    return NextResponse.json({ spreadsheetId })
  } catch (error) {
    console.error("Error creating annotation sheet:", error)
    return NextResponse.json({ error: "Failed to create annotation sheet" }, { status: 500 })
  }
}
