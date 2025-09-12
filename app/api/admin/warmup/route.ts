import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { initializeGoogleAPIs } from "@/lib/google-apis"

// Admin-only endpoint to warm up and cache Google API clients to mitigate cold start latency.
export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(request, { role: "admin" })
  if (response) return response
  try {
    const t0 = Date.now()
    initializeGoogleAPIs(session!.accessToken, { reuse: true, logPerf: () => {} })
    const ms = Date.now() - t0
    return NextResponse.json({ warmed: true, ms })
  } catch (e) {
    return NextResponse.json({ error: "Warmup failed" }, { status: 500 })
  }
}
