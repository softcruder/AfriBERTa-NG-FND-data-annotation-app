import { type NextRequest, NextResponse } from "next/server"
import { createAnnotationSheet } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "sheets:create:POST", limit: 2, windowMs: 3000 })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response

    // Safely parse JSON body to avoid throwing on empty/invalid input
    const raw = await request.text()
    if (!raw) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    let title: string | undefined
    try {
      const parsed = JSON.parse(raw)
      title = parsed?.title
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })

    const spreadsheetId = await createAnnotationSheet(session!.accessToken, title)

    return NextResponse.json({ spreadsheetId })
  } catch (error) {
    console.error("Error creating annotation sheet:", error)
    return NextResponse.json({ error: "Failed to create annotation sheet" }, { status: 500 })
  }
}
