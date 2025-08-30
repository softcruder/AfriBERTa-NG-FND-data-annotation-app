"use client"

import { createContext, useContext, PropsWithChildren } from "react"
import { useSWRGet } from "@/hooks/useRequest"
import type { KeyedMutator } from "swr"

export type AppConfig = {
  ANNOTATION_SPREADSHEET_ID?: string
  CSV_FILE_ID?: string
  [k: string]: string | undefined
}

interface ConfigContextValue {
  config?: AppConfig
  isLoading: boolean
  error?: unknown
  // Convenience helpers
  spreadsheetId?: string
  csvFileId?: string
  mutate: KeyedMutator<{ config: AppConfig }>
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined)

export function ConfigProvider({ children }: PropsWithChildren) {
  const { data, isLoading, error, mutate } = useSWRGet<{ config: AppConfig }>("/config")

  const value: ConfigContextValue = {
    config: data?.config,
    isLoading,
    error,
    spreadsheetId: data?.config?.ANNOTATION_SPREADSHEET_ID,
    csvFileId: data?.config?.CSV_FILE_ID,
    mutate,
  }
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider. Prefer useAuth() in new code.")
  return ctx
}
