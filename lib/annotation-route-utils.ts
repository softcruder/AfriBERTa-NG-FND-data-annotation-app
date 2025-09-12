// Shared utilities for annotation API routes (regular & translation)
// Provides: perf logging, rowId cache with TTL, background formula update queue.

import { updatePaymentFormulas } from "@/lib/google-apis"

// ---- Performance Logging ----
export function logPerf(label: string, start: number, extra?: Record<string, any>) {
  const ms = Date.now() - start
  console.log(JSON.stringify({ evt: "annot_route_perf", phase: label, ms, ...(extra || {}) }))
}
export function now() {
  return Date.now()
}

// ---- RowId Cache (per spreadsheet) ----
const ROWID_CACHE_TTL_MS = 15_000
const rowIdCache: Map<string, { expires: number; ids: Set<string> }> = new Map()
export function getCachedRowIds(spreadsheetId: string): Set<string> | null {
  const entry = rowIdCache.get(spreadsheetId)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    rowIdCache.delete(spreadsheetId)
    return null
  }
  return entry.ids
}
export function setCachedRowIds(spreadsheetId: string, ids: Set<string>) {
  rowIdCache.set(spreadsheetId, { ids, expires: Date.now() + ROWID_CACHE_TTL_MS })
}
export function appendRowIdToCache(spreadsheetId: string, rowId?: string) {
  if (!rowId) return
  const entry = rowIdCache.get(spreadsheetId)
  if (entry) entry.ids.add(rowId)
}

// ---- Background Formula Queue ----
const FORMULA_MIN_DELAY_MS = 5_000
interface FormulaQueueEntry {
  ts: number
  accessToken: string
}
const formulaQueue = new Map<string, FormulaQueueEntry>()
let formulaWorkerScheduled = false

export function enqueueFormulaUpdate(spreadsheetId: string, accessToken: string) {
  formulaQueue.set(spreadsheetId, { ts: Date.now(), accessToken })
  if (!formulaWorkerScheduled) {
    formulaWorkerScheduled = true
    setTimeout(runFormulaWorker, FORMULA_MIN_DELAY_MS)
  }
}

async function runFormulaWorker() {
  formulaWorkerScheduled = false
  const nowTs = Date.now()
  const entries = [...formulaQueue.entries()]
  formulaQueue.clear()
  for (const [spreadsheetId, entry] of entries) {
    const { ts, accessToken } = entry
    if (nowTs - ts < FORMULA_MIN_DELAY_MS - 50) {
      enqueueFormulaUpdate(spreadsheetId, accessToken)
      continue
    }
    try {
      if (!accessToken) {
        console.warn("[annot-utils] skip formula update (no token)", { spreadsheetId })
        continue
      }
      await updatePaymentFormulas(accessToken, spreadsheetId)
      logPerf("formula_bg_updated", now(), { spreadsheetId })
    } catch (e) {
      console.warn("[annot-utils] background formula update failed", spreadsheetId, e)
    }
  }
  if (formulaQueue.size > 0 && !formulaWorkerScheduled) {
    formulaWorkerScheduled = true
    setTimeout(runFormulaWorker, FORMULA_MIN_DELAY_MS)
  }
}

export function isRowIdDuplicate(rowId: string | undefined | null, existing: Set<string>): boolean {
  if (!rowId) return false
  return existing.has(rowId.trim())
}
