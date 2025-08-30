"use client"

import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"

export function useUsers(spreadsheetId?: string) {
  const key = spreadsheetId ? buildURL("/users", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ users: any[] }>(key)
  return { data: data?.users ?? [], error, isLoading, mutate }
}

export function useAddUser() {
  const { request, loading, error } = useRequest<{ success: boolean }>()
  const add = (payload: { spreadsheetId: string; user: any }) => request.post("/users", payload)
  return { add, loading, error }
}

export function useUpdateUser() {
  const { request, loading, error } = useRequest<{ success: boolean }>()
  const update = (payload: { spreadsheetId: string; userId: string; updates: any }) => request.patch("/users", payload)
  return { update, loading, error }
}
