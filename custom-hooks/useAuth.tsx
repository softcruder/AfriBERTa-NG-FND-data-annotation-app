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
  translationLanguages?: string[] // Languages user can translate
}

export type AuthContextValue = {
  user: SessionUser | null
  isAdmin: boolean
  isAnnotator: boolean
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
  const fetcher = async (url: string) => {
    let attempt = 0
    const maxAttempts = 3
    let lastErr: any
    while (attempt < maxAttempts) {
      try {
        const r = await fetch(url)
        if (!r.ok) {
          // Handle authentication errors by redirecting to login
          if (r.status === 401) {
            // Session is expired, redirect to auth page only if not already there
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
              window.location.href = "/?error=session_expired"
            }
            throw new Error("Session expired") // Still throw to stop SWR
          }
          throw r
        }
        return await r.json()
      } catch (e) {
        lastErr = e
        attempt += 1
        if (attempt >= maxAttempts) break
        // simple backoff: 200ms, 400ms
        await new Promise(res => setTimeout(res, attempt * 200))
      }
    }
    throw lastErr
  }
  const {
    data: { user, config, expiresAt } = {},
    isLoading,
    mutate,
  } = useSWR<{ user: SessionUser; expiresAt: number; config: Record<string, string> }>("/api/session", fetcher, {})

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
      user: user ?? null,
      isAdmin: user?.role === "admin",
      isAnnotator: user?.role === "annotator",
      expiresAt,
      loading: isLoading,
      config: config ?? {},
      spreadsheetId: config?.ANNOTATION_SPREADSHEET_ID,
      csvFileId: config?.CSV_FILE_ID,
      logout,
      refresh: async () => {
        await mutate()
      },
    }),
    [config, expiresAt, isLoading, logout, mutate, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
