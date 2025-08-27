import { type NextRequest, NextResponse } from "next/server"
import { createAnnotationSheet } from "@/lib/google-apis"

export async function POST(request: NextRequest) {
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
