"use client"

import { useRequest } from "@/hooks/useRequest"

export function useVerifyAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean }>()
  const verify = (payload: { spreadsheetId: string; rowId: string }) => request.post("/qa/verify", payload)
  return { verify, loading, error, data }
}
