import { type NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"

// This route simply redirects to Google's OAuth consent screen.
// The token exchange is handled in /api/auth/google/callback.
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "auth:google:GET", limit: 10, windowMs: 3000 })
  if (limited) return limited

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set(
    "scope",
    "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
  )
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")

  return NextResponse.redirect(authUrl)
}
