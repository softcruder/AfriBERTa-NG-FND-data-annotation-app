import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie, type AuthSession } from "@/lib/auth"

export type Role = "annotator" | "admin"

export async function requireSession(
  request: NextRequest,
  opts?: { role?: Role },
): Promise<{ response?: NextResponse; session?: AuthSession }> {
  const cookie = request.cookies.get("auth_session")
  if (!cookie) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) }
  const session = getSessionFromCookie(cookie.value)
  if (!session) return { response: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }) }
  if (opts?.role && session.user.role !== opts.role) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }
  }
  return { session }
}
