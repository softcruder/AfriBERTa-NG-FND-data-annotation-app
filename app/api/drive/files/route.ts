import { type NextRequest, NextResponse } from "next/server"
import { listDriveFiles } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "drive:files:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    const files = await listDriveFiles(session!.accessToken, query || undefined)

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Error listing Drive files:", error)
    return NextResponse.json({ error: "Failed to list Drive files" }, { status: 500 })
  }
}
