import { NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request as any, { route: "auth:logout:POST", limit: 5, windowMs: 3000 })
  if (limited) return limited
  const response = NextResponse.json({ success: true })

  // Clear the auth session cookie
  response.cookies.set("auth_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
  })

  return response
}
