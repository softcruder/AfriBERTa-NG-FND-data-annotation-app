import { NextRequest, NextResponse } from "next/server"
import { encryptSession } from "@/lib/encryption"
import { getPossiblyExpiredSession } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "auth:refresh:POST", limit: 10, windowMs: 3000 })
  if (limited) return limited

  try {
    const cookie = request.cookies.get("auth_session")
    if (!cookie) return NextResponse.json({ error: "No session" }, { status: 401 })
    const session = getPossiblyExpiredSession(cookie.value)
    if (!session || !session.refreshToken) return NextResponse.json({ error: "No refresh token" }, { status: 401 })

    // Exchange refresh_token for new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      }),
    })
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 })
    }
    const tokens = await tokenResponse.json()

    const updated = {
      ...session,
      accessToken: tokens.access_token,
      // Google usually doesn't return a new refresh_token on refresh; keep existing
      refreshToken: session.refreshToken,
      expiresAt: Date.now() + (tokens.expires_in ? tokens.expires_in * 1000 : 3600 * 1000),
    }

    const res = NextResponse.json({ ok: true, expiresAt: updated.expiresAt })
    const encrypted = encryptSession(JSON.stringify(updated))
    res.cookies.set("auth_session", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 604800, // 7 days
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
