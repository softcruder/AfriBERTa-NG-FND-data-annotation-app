"use client"

import { useRequest } from "@/hooks/useRequest"

export function useExport() {
  const { request, loading, error, data } = useRequest<any>()
  const exportData = (payload: any) => request.post("/export", payload)
  return { exportData, loading, error, data }
}
