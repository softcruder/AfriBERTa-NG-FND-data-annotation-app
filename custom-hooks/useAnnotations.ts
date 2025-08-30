"use client"

import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"
import type { AnnotationRow } from "@/lib/google-apis"
import type { AnnotationFormData } from "@/lib/validation"

export function useAnnotations(spreadsheetId?: string) {
  const key = spreadsheetId ? buildURL("/annotations", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ annotations: AnnotationRow[] }>(key)
  return { data: data?.annotations ?? [], error, isLoading, mutate }
}

export function useCreateAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean }>()
  const create = (payload: { spreadsheetId: string; annotation: AnnotationRow | AnnotationFormData }) =>
    request.post("/annotations", payload)
  return { create, loading, error, data }
}
