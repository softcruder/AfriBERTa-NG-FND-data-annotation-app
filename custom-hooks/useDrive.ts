"use client"

import { useSWRGet } from "@/hooks/useRequest"
import type { DriveFile } from "@/lib/google-apis"

export function useDriveFiles(query?: string) {
  const key = query ? `/drive/files?query=${encodeURIComponent(query)}` : "/drive/files"
  const { data, error, isLoading, mutate } = useSWRGet<{ files: DriveFile[] }>(key)
  return { data: data?.files ?? [], error, isLoading, mutate }
}

export function useFactChecksCSVFileId() {
  const { data, error, isLoading, mutate } = useSWRGet<{ fileId: string }>("/drive/factchecks-csv")
  return { fileId: data?.fileId, error, isLoading, mutate }
}
