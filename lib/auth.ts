import { encryptSession, decryptSession } from './encryption'

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

    // Decrypt the session data
    const decryptedData = decryptSession(stored)
    const session: AuthSession = JSON.parse(decryptedData)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("auth_session")
      return null
    }

    return session
  } catch {
    // If decryption fails, clear the invalid session
    localStorage.removeItem("auth_session")
    return null
  }
}

export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") return
  
  try {
    // Encrypt the session data before storing
    const sessionData = JSON.stringify(session)
    const encryptedData = encryptSession(sessionData)
    localStorage.setItem("auth_session", encryptedData)
  } catch (error) {
    console.error('Failed to store encrypted session:', error)
    throw new Error('Failed to store session')
  }
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

/**
 * Server-side function to get session from encrypted cookie
 */
export function getSessionFromCookie(cookieValue: string): AuthSession | null {
  try {
    const decryptedData = decryptSession(cookieValue)
    const session: AuthSession = JSON.parse(decryptedData)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to decrypt session from cookie:', error)
    return null
  }
}

/**
 * Extract session from request cookies
 */
export function getSessionFromRequest(request: Request): AuthSession | null {
  const sessionCookie = request.headers.get('cookie')?.match(/auth_session=([^;]+)/)?.[1]
  
  if (!sessionCookie) {
    return null
  }

  return getSessionFromCookie(decodeURIComponent(sessionCookie))
}
