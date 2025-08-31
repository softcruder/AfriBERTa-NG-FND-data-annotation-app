import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { updateAnnotationStatus } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "qa:verify:POST", limit: 5, windowMs: 3000 })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const { spreadsheetId, rowId } = await request.json()
    if (!spreadsheetId || !rowId) {
      return NextResponse.json({ error: "spreadsheetId and rowId are required" }, { status: 400 })
    }

    // As requested, allow both annotator and admin to do QA
    await updateAnnotationStatus(session!.accessToken, spreadsheetId, rowId, {
      status: "verified",
      verifiedBy: session!.user.email,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: "Verification failed", details: message }, { status: 500 })
  }
}
