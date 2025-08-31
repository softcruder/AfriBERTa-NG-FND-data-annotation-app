"use client"

import { useSWRGet, buildURL } from "@/hooks/useRequest"
import type { PaymentSummary } from "@/lib/google-apis"
import type { KeyedMutator } from "swr"

export function usePayments(spreadsheetId?: string): {
  data: PaymentSummary[]
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ payments: PaymentSummary[] }>
} {
  const key = spreadsheetId ? buildURL("/payments", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ payments: PaymentSummary[] }>(key)
  return { data: data?.payments ?? [], error, isLoading, mutate }
}
