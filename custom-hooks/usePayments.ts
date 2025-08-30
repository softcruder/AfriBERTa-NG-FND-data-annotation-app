"use client"

import { useSWRGet, buildURL } from "@/hooks/useRequest"

export function usePayments(spreadsheetId?: string) {
  const key = spreadsheetId ? buildURL("/payments", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ payments: any[] }>(key)
  return { data: data?.payments ?? [], error, isLoading, mutate }
}
