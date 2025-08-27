// Authentication utilities and types
export interface User {
  id: string
  email: string
  name: string
  picture?: string
  role: "annotator" | "admin"
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

// Google OAuth configuration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
  scopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
  ].join(" "),
}

// Helper function to generate Google OAuth URL
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId || "",
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri || "",
    response_type: "code",
    scope: GOOGLE_OAUTH_CONFIG.scopes,
    access_type: "offline",
    prompt: "consent",
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Session management
export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("auth_session")
    if (!stored) return null

    const session: AuthSession = JSON.parse(stored)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("auth_session")
      return null
    }

    return session
  } catch {
    return null
  }
}

export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_session", JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_session")
}

export async function getSession(): Promise<AuthSession | null> {
  // For server-side usage, we need to get session from cookies or headers
  // In a real implementation, this would validate JWT tokens or session cookies

  // For now, return a mock session for development
  // In production, this should validate actual session tokens
  if (typeof window !== "undefined") {
    return getStoredSession()
  }

  // Server-side session validation would go here
  // This is a simplified version for the demo
  return null
}
