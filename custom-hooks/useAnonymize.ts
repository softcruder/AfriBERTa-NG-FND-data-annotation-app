"use client"

import { useRequest } from "@/hooks/useRequest"

export function useAnonymizeSelf() {
  const { request, loading, error, data } = useRequest<{ success: boolean; updated: number }>()
  const anonymize = () => request.post("/annotations/anonymize")
  return { anonymize, loading, error, data }
}
