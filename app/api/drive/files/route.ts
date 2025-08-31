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
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "5")))
    const pageToken = searchParams.get("pageToken") || undefined

    const { files, nextPageToken } = await listDriveFiles(session!.accessToken, query || undefined, {
      pageSize,
      pageToken,
    })

    return NextResponse.json({ files, nextPageToken })
  } catch (error) {
    console.error("Error listing Drive files:", error)
    return NextResponse.json({ error: "Failed to list Drive files" }, { status: 500 })
  }
}
