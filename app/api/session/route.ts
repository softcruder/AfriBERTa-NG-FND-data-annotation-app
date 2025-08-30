import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { requireSession } from "@/lib/server-auth"
import { getAppConfigSafe } from "@/lib/google-apis"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "session:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const cfg = await getAppConfigSafe(session!.accessToken)
    return NextResponse.json({
      user: session!.user,
      expiresAt: session!.expiresAt,
      config: cfg || {},
    })
  } catch (e) {
    // Return session even if config lookup fails
    return NextResponse.json({ user: session!.user, expiresAt: session!.expiresAt, config: {} })
  }
}
