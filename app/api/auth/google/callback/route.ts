import { type NextRequest, NextResponse } from "next/server"
import { getUserRole } from "@/lib/admin-auth"
import { getAppConfig, upsertUserByEmail } from "@/lib/google-apis"
import { encryptSession } from "@/lib/encryption"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "auth:google:callback:GET", limit: 10, windowMs: 3000 })
  if (limited) return limited
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    // Exchange authorization code for access token
    // Build redirect_uri dynamically from the current request to support local/prod
    const redirectUri = `${request.nextUrl.origin}${request.nextUrl.pathname}`
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to get user info")
    }

    const user = await userResponse.json()

    // Create session compatible with AuthSession type used across the app
    const session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: getUserRole(user.email),
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    }

    const response = NextResponse.redirect(new URL("/dashboard", request.url))

    // Try to upsert user into Users sheet if a spreadsheetId is configured in App Config
    try {
      const appCfg = await getAppConfig(tokens.access_token)
      const spreadsheetId = appCfg["ANNOTATION_SPREADSHEET_ID"]
      if (spreadsheetId) {
        await upsertUserByEmail(tokens.access_token, spreadsheetId, {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        })
      }
    } catch (e) {
      // Non-blocking: failure here shouldn't prevent login
      console.warn("User upsert skipped:", e)
    }

    // Encrypt and set session cookie
    const encryptedSession = encryptSession(JSON.stringify(session))
    response.cookies.set("auth_session", encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 604800, // 7 days in seconds
    })

    return response
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
