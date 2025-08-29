import { type NextRequest, NextResponse } from "next/server"
import { listDriveFiles } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    const files = await listDriveFiles(session.accessToken, query || undefined)

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing Drive files:", error)
    return NextResponse.json({ error: "Failed to list Drive files" }, { status: 500 })
  }
}
