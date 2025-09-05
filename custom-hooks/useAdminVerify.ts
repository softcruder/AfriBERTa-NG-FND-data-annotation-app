import { useState } from "react"
import { useRequest } from "@/hooks/useRequest"

export interface AdminVerifyRequest {
  spreadsheetId: string
  rowId: string
  action: "approve" | "needs-revision" | "mark-invalid"
  comments?: string
  invalidityReason?: string
}

export interface AdminVerifyResponse {
  success: boolean
  message: string
}

export function useAdminVerify() {
  const { request } = useRequest<AdminVerifyResponse>()

  const adminVerify = async (data: AdminVerifyRequest): Promise<AdminVerifyResponse> => {
    return await request.post("/admin/verify", data)
  }

  return { adminVerify }
}
