import { type NextRequest, NextResponse } from "next/server"
import { logAnnotation, getAnnotations, updatePaymentFormulas, initializeGoogleAPIs } from "@/lib/google-apis"
import { getSessionFromCookie } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:GET" })
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

    const searchParams = request.nextUrl.searchParams
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    const annotations = await getAnnotations(session.accessToken, spreadsheetId)

    return NextResponse.json({ annotations })
  } catch (error) {
    console.error("Error getting annotations:", error)
    return NextResponse.json({ error: "Failed to get annotations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "annotations:POST" })
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

    const { spreadsheetId, annotation } = await request.json()

    if (!spreadsheetId || !annotation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure annotator can only log their own annotations
    if (session.user.role === "annotator" && annotation.annotatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Preflight: verify the current user has edit access to the spreadsheet
    try {
      const { drive } = initializeGoogleAPIs(session.accessToken)
      const file = await drive.files.get({ fileId: spreadsheetId, fields: "id, capabilities" })
      const canEdit = (file.data as any)?.capabilities?.canEdit
      if (!canEdit) {
        return NextResponse.json(
          {
            error: "No edit permission on spreadsheet",
            details:
              "Your Google account doesn't have editor access to this sheet. Ask the owner to share it with you as an editor, or select a sheet you own in Data Configuration.",
          },
          { status: 403 },
        )
      }
    } catch (e) {
      // If capability check fails (e.g., file not found), surface message
      const message = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: "Spreadsheet access check failed", details: message }, { status: 403 })
    }

    await logAnnotation(session.accessToken, spreadsheetId, annotation)

    // Update payment formulas after logging annotation; don't block success if this fails
    try {
      await updatePaymentFormulas(session.accessToken, spreadsheetId)
      return NextResponse.json({ success: true })
    } catch (e) {
      console.warn("Payment formula update failed:", e)
      return NextResponse.json({ success: true, warning: "Annotation saved, but payment formulas not updated." })
    }
  } catch (error) {
    console.error("Error logging annotation:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to log annotation", details: message }, { status: 500 })
  }
}
