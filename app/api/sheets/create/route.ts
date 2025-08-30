import { type NextRequest, NextResponse } from "next/server"
import { createAnnotationSheet } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import { z } from "zod"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "sheets:create:POST", limit: 2, windowMs: 3000 })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response

    // Validate request body with a small schema for clearer 400s
    const BodySchema = z.object({
      title: z.string({ required_error: "Title is required" }).min(1, "Title is required"),
    })

    // Read raw to distinguish invalid JSON vs missing fields
    const raw = await request.text()
    if (!raw) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const result = BodySchema.safeParse(parsed)
    if (!result.success) {
      const first = result.error.issues[0]
      const isTitleIssue = first?.path?.[0] === "title"
      const message = isTitleIssue ? "Title is required" : first?.message || "Invalid request body"
      return NextResponse.json({ error: message, message: "Invalid request" }, { status: 400 })
    }
    const { title } = result.data

    const spreadsheetId = await createAnnotationSheet(session!.accessToken, title)

    return NextResponse.json({ spreadsheetId })
  } catch (error) {
    console.error("Error creating annotation sheet:", error)
    return NextResponse.json({ error: "Failed to create annotation sheet" }, { status: 500 })
  }
}
