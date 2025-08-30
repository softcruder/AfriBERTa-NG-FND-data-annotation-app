"use client"

import { useRequest } from "@/hooks/useRequest"

export type ExportFormat = "csv" | "json" | "xlsx"
export type ExportRequest = {
  format: ExportFormat
  dateRange?: { from: Date; to: Date }
  annotators?: string[]
  includePayments?: boolean
  includeTimeTracking?: boolean
}

export type ExportResponse =
  | string // when csv/xlsx we currently return a string body (or binary in future)
  | {
      annotations: any[]
      summary: { totalAnnotations: number; totalTimeSpent: number; totalPayment?: number }
      message: string
    }

export function useExport() {
  const { request, loading, error, data } = useRequest<ExportResponse>()
  const exportData = (payload: ExportRequest) => request.post("/export", payload)
  return { exportData, loading, error, data }
}
