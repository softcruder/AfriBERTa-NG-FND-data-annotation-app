import { type NextRequest, NextResponse } from "next/server"
import { GOOGLE_OAUTH_SCOPES } from "@/lib/auth"
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
  authUrl.searchParams.set("scope", GOOGLE_OAUTH_SCOPES.join(" "))
  authUrl.searchParams.set("access_type", "offline")
  // Do not force consent every time; allow client to choose prompt
  const prompt = request.nextUrl.searchParams.get("prompt")
  if (prompt) authUrl.searchParams.set("prompt", prompt)

  return NextResponse.redirect(authUrl)
}
