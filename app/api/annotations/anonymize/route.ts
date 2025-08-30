import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/auth"
import { anonymizeAnnotationsByAnnotator, getAppConfig } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:anonymize:POST", limit: 2, windowMs: 3000 })
  if (limited) return limited
  const cookie = request.cookies.get("auth_session")
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const session = getSessionFromCookie(cookie.value)
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })

  try {
    // Allow only the logged-in user to anonymize their own data
    const cfg = await getAppConfig(session.accessToken)
    const spreadsheetId = cfg["ANNOTATION_SPREADSHEET_ID"]
    if (!spreadsheetId) return NextResponse.json({ error: "Spreadsheet not configured" }, { status: 400 })

    const result = await anonymizeAnnotationsByAnnotator(session.accessToken, spreadsheetId, session.user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Anonymization failed", details: message }, { status: 500 })
  }
}
