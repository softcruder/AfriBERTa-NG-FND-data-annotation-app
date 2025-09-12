import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import {
  getFormulaQueueDepth,
  getFormulaQueueEntries,
  getAllLastFormulaUpdates,
  setLastFormulaUpdate,
} from "@/lib/annotation-route-utils"
import { getFormulaLastUpdateMap } from "@/lib/google-apis"

// Admin-only endpoint providing introspection into the background formula update queue
// Returns current queue depth, individual entries, and last known formula update timestamps
// (merged from in-memory map plus any persisted entries in the global App Config store)
export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "admin:annotations:queue:GET" })
  if (limited) return limited
  const { response, session } = await requireSession(request, { role: "admin" })
  if (response) return response

  try {
    // Pull persisted timestamps and merge into in-memory for visibility (don't overwrite fresher values)
    const persisted = await getFormulaLastUpdateMap(session!.accessToken)
    for (const [id, ts] of Object.entries(persisted)) {
      // setLastFormulaUpdate only if we don't have it yet in memory
      // (In-memory values are authoritative for current instance freshness.)
      // We pass provided timestamp to avoid replacing with Date.now()
      if (getAllLastFormulaUpdates().find(e => e.spreadsheetId === id) == null) {
        setLastFormulaUpdate(id, ts)
      }
    }

    return NextResponse.json({
      queueDepth: getFormulaQueueDepth(),
      queue: getFormulaQueueEntries(),
      lastUpdates: getAllLastFormulaUpdates(),
    })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load queue metrics" }, { status: 500 })
  }
}
