import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { enforceRateLimit } from "@/lib/rate-limit"
import { requireSession } from "@/lib/server-auth"
import { getAppConfigSafe, updateUser } from "@/lib/google-apis"

const updateLanguagesSchema = z.object({
  translationLanguages: z.array(z.enum(["ha", "yo"])).max(2, "Maximum 2 languages supported"),
})

export async function PUT(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "users:languages:PUT", limit: 10, windowMs: 60000 })
  if (limited) return limited

  const { response, session } = await requireSession(request)
  if (response) return response

  try {
    const body = await request.json()
    const { translationLanguages } = updateLanguagesSchema.parse(body)

    const cfg = await getAppConfigSafe(session!.accessToken)
    if (!cfg?.ANNOTATION_SPREADSHEET_ID) {
      return NextResponse.json({ error: "Spreadsheet not configured" }, { status: 500 })
    }

    // Update user's translation languages in Google Sheets
    await updateUser(session!.accessToken, cfg.ANNOTATION_SPREADSHEET_ID, session!.user.email, {
      translationLanguages: translationLanguages.join(","),
    })

    return NextResponse.json({
      success: true,
      translationLanguages,
    })
  } catch (error) {
    console.error("Error updating translation languages:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update translation languages" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "users:languages:GET", limit: 20, windowMs: 60000 })
  if (limited) return limited

  const { response, session } = await requireSession(request)
  if (response) return response

  // Return current user's translation languages
  return NextResponse.json({
    translationLanguages: session!.user.translationLanguages || [],
  })
}
