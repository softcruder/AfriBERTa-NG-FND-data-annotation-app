"use client"

import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"
import type { User as SheetUser } from "@/lib/google-apis"
import type { KeyedMutator } from "swr"

export function useUsers(spreadsheetId?: string): {
  data: SheetUser[]
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ users: SheetUser[] }>
} {
  const key = spreadsheetId ? buildURL("/users", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ users: SheetUser[] }>(key)
  return { data: data?.users ?? [], error, isLoading, mutate }
}

export function useAddUser() {
  const { request, loading, error } = useRequest<{ success: boolean }>()
  const add = (payload: { spreadsheetId: string; user: SheetUser }) => request.post("/users", payload)
  return { add, loading, error }
}

export function useUpdateUser() {
  const { request, loading, error } = useRequest<{ success: boolean }>()
  const update = (payload: { spreadsheetId: string; userId: string; updates: Partial<SheetUser> }) =>
    request.patch("/users", payload)
  return { update, loading, error }
}
