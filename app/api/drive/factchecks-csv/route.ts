import { type NextRequest, NextResponse } from "next/server"
import { findFactChecksCSV } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "drive:factchecks-csv:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const fileId = await findFactChecksCSV(session!.accessToken)

    return NextResponse.json({ fileId })
  } catch (error) {
    console.error("Error finding factchecks CSV:", error)
    return NextResponse.json({ error: "Failed to find factchecks.csv" }, { status: 500 })
  }
}
