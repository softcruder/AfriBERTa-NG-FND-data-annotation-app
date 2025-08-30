import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/auth"
import { getAppConfigSafe } from "@/lib/google-apis"

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("auth_session")
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const session = getSessionFromCookie(cookie.value)
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })

  try {
    const cfg = await getAppConfigSafe(session.accessToken)
    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt,
      config: cfg || {},
    })
  } catch (e) {
    // Return session even if config lookup fails
    return NextResponse.json({ user: session.user, expiresAt: session.expiresAt, config: {} })
  }
}
