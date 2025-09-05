import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { requireSession } from "@/lib/server-auth"
import { getAppConfigSafe, getUsers } from "@/lib/google-apis"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "session:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const cfg = await getAppConfigSafe(session!.accessToken)

    // Fetch user profile with translation languages from Google Sheets
    let enhancedUser = session!.user
    if (cfg?.ANNOTATION_SPREADSHEET_ID) {
      try {
        const users = await getUsers(session!.accessToken, cfg.ANNOTATION_SPREADSHEET_ID)
        const userProfile = users.find(u => u.email.toLowerCase() === session!.user.email.toLowerCase())
        if (userProfile) {
          enhancedUser = {
            ...session!.user,
            translationLanguages: userProfile.translationLanguages
              ? userProfile.translationLanguages
                  .split(",")
                  .map((lang: string) => lang.trim())
                  .filter(Boolean)
              : undefined,
          }
        }
      } catch (e) {
        // Non-blocking: if user profile fetch fails, continue with basic user data
        console.warn("Failed to fetch user profile:", e)
      }
    }

    return NextResponse.json({
      user: enhancedUser,
      expiresAt: session!.expiresAt,
      config: cfg || {},
    })
  } catch (e) {
    // Return session even if config lookup fails
    return NextResponse.json({ user: session!.user, expiresAt: session!.expiresAt, config: {} })
  }
}
