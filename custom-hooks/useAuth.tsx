"use client"

import { createContext, useContext, PropsWithChildren, useMemo, useCallback } from "react"
import useSWR from "swr"
import { useRequest } from "@/hooks/useRequest"

export type SessionUser = {
  id: string
  email: string
  name: string
  picture?: string
  role: "annotator" | "admin"
}

export type AuthContextValue = {
  user: SessionUser | null
  expiresAt?: number
  loading: boolean
  config: Record<string, string>
  spreadsheetId?: string
  csvFileId?: string
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const fetcher = (url: string) => fetch(url).then(r => (r.ok ? r.json() : Promise.reject(r)))
  const { data, isLoading, mutate } = useSWR<{ user: SessionUser; expiresAt: number; config: Record<string, string> }>(
    "/api/session",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 15000,
      keepPreviousData: true,
    },
  )

  const { request } = useRequest<{ success: boolean }>()
  const logout = useCallback(async () => {
    await request.post("/auth/logout")
    await mutate(undefined, { revalidate: false })
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }, [mutate, request])

  const value: AuthContextValue = useMemo(
    () => ({
      user: data?.user ?? null,
      expiresAt: data?.expiresAt,
      loading: isLoading,
      config: data?.config ?? {},
      spreadsheetId: data?.config?.ANNOTATION_SPREADSHEET_ID,
      csvFileId: data?.config?.CSV_FILE_ID,
      logout,
      refresh: async () => {
        await mutate()
      },
    }),
    [data, isLoading, logout, mutate],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
