"use client"

import { useSWRGet, buildURL } from "@/hooks/useRequest"
import type { AnnotationRow } from "@/lib/google-apis"
import type { KeyedMutator } from "swr"

const EMPTY: AnnotationRow[] = []

export function useMyAnnotations(spreadsheetId?: string): {
  data: AnnotationRow[]
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ annotations: AnnotationRow[] }>
} {
  const key = spreadsheetId ? buildURL("/annotations/self", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ annotations: AnnotationRow[] }>(key)
  return { data: data?.annotations ?? EMPTY, error, isLoading, mutate }
}
