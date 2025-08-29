import { type NextRequest, NextResponse } from "next/server"
import { logAnnotation, getAnnotations, updatePaymentFormulas } from "@/lib/google-apis"
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

    await logAnnotation(session.accessToken, spreadsheetId, annotation)

    // Update payment formulas after logging annotation
    await updatePaymentFormulas(session.accessToken, spreadsheetId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging annotation:", error)
    return NextResponse.json({ error: "Failed to log annotation" }, { status: 500 })
  }
}
