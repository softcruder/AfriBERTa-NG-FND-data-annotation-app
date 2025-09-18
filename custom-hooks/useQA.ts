"use client"

import { useRequest } from "@/hooks/useRequest"

interface VerifyPayloadBase {
  spreadsheetId: string
  rowId: string
}

interface VerifyPayload extends VerifyPayloadBase {
  // Peer reviewer approval flag
  isApproved?: boolean
  // Optional QA comments
  qaComments?: string
  // Content edits applied during QA (diff fields)
  contentUpdates?: Record<string, any>
  // Admin finalize (promote to verified directly)
  adminFinalize?: boolean
  // Override self-verification guard (admin only)
  adminOverride?: boolean
}

export function useVerifyAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean; status?: string; diffCount?: number }>()
  const verify = (payload: VerifyPayload) => request.post("/qa/verify", payload)
  return { verify, loading, error, data }
}
