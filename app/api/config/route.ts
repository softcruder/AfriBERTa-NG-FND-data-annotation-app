import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/auth"
import { getAppConfigSafe, setAppConfig, findOrCreateAppConfigSpreadsheet } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "config:GET" })
  if (limited) return limited
  const cookie = request.cookies.get("auth_session")
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const session = getSessionFromCookie(cookie.value)
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })

  try {
    // Do not create the config store for non-admins during GET
    const cfg = await getAppConfigSafe(session.accessToken)
    return NextResponse.json({ config: cfg || {} })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "config:POST" })
  if (limited) return limited
  const cookie = request.cookies.get("auth_session")
  if (!cookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const session = getSessionFromCookie(cookie.value)
  if (!session) return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })

  // Only admin can set config
  if (session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  try {
    const body = await request.json()
    const entries = body?.entries as Record<string, string>
    if (!entries || typeof entries !== "object") {
      return NextResponse.json({ error: "entries object required" }, { status: 400 })
    }
    // Ensure config sheet exists for admin save
    await findOrCreateAppConfigSpreadsheet(session.accessToken)
    await setAppConfig(session.accessToken, entries)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
