"use client"

import { createContext, useContext, PropsWithChildren } from "react"
import { useSWRGet } from "@/hooks/useRequest"

export type AppConfig = {
  ANNOTATION_SPREADSHEET_ID?: string
  CSV_FILE_ID?: string
  [k: string]: string | undefined
}

interface ConfigContextValue {
  config?: AppConfig
  isLoading: boolean
  error?: any
  // Convenience helpers
  spreadsheetId?: string
  csvFileId?: string
  mutate: (data?: AppConfig | Promise<AppConfig> | undefined, shouldRevalidate?: boolean) => Promise<any>
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
    mutate: async (...args: any[]) => mutate(...args),
  }
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider")
  return ctx
}
