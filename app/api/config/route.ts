import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { getAppConfigSafe, setAppConfig, findOrCreateAppConfigSpreadsheet } from "@/lib/google-apis"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "config:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    // Do not create the config store for non-admins during GET
    const cfg = await getAppConfigSafe(session!.accessToken)
    return NextResponse.json({ config: cfg || {} })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "config:POST" })
  if (limited) return limited
  const { response, session } = await requireSession(request, { role: "admin" })
  if (response) return response

  // session role enforced above

  try {
    const body = await request.json()
    const entries = body?.entries as Record<string, string>
    if (!entries || typeof entries !== "object") {
      return NextResponse.json({ error: "entries object required" }, { status: 400 })
    }
    // Ensure config sheet exists for admin save
    await findOrCreateAppConfigSpreadsheet(session!.accessToken)
    await setAppConfig(session!.accessToken, entries)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
