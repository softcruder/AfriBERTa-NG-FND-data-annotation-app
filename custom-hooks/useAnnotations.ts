"use client"

import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"

export function useAnnotations(spreadsheetId?: string) {
  const key = spreadsheetId ? buildURL("/annotations", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ annotations: any[] }>(key)
  return { data: data?.annotations ?? [], error, isLoading, mutate }
}

export function useCreateAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean }>()
  const create = (payload: { spreadsheetId: string; annotation: any }) => request.post("/annotations", payload)
  return { create, loading, error, data }
}
