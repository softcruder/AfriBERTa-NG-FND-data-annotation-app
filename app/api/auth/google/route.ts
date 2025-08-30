import { type NextRequest, NextResponse } from "next/server"
import { getUserRole } from "@/lib/admin-auth"
import { encryptSession } from "@/lib/encryption"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    // Exchange authorization code for access token
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
    redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to get user info")
    }

    const userInfo = await userResponse.json()

    // Check if user is authorized and assign proper role
    const user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      role: getUserRole(userInfo.email), // Use admin authorization logic
    }

  const session = {
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    }

    // Create response with session data
    const response = NextResponse.redirect(new URL("/dashboard", request.url))

    // Encrypt and set session cookie (httpOnly for security)
    const encryptedSession = encryptSession(JSON.stringify(session))
    response.cookies.set("auth_session", encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    })

    return response
  } catch (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
