"use client"

import { useSWRGet } from "@/hooks/useRequest"
import type { KeyedMutator } from "swr"
import type { DriveFile } from "@/lib/google-apis"

export function useDriveFiles(params?: { query?: string; pageSize?: number; pageToken?: string }): {
  data: DriveFile[]
  nextPageToken?: string
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ files: DriveFile[]; nextPageToken?: string }>
} {
  const search = new URLSearchParams()
  if (params?.query) search.set("query", params.query)
  if (params?.pageSize) search.set("pageSize", String(params.pageSize))
  if (params?.pageToken) search.set("pageToken", params.pageToken)
  const key = search.toString() ? `/drive/files?${search.toString()}` : "/drive/files"
  const { data, error, isLoading, mutate } = useSWRGet<{ files: DriveFile[]; nextPageToken?: string }>(key)
  return { data: data?.files ?? [], nextPageToken: data?.nextPageToken, error, isLoading, mutate }
}

export function useFactChecksCSVFileId(): {
  fileId?: string
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ fileId: string }>
} {
  const { data, error, isLoading, mutate } = useSWRGet<{ fileId: string }>("/drive/factchecks-csv")
  return { fileId: data?.fileId, error, isLoading, mutate }
}
