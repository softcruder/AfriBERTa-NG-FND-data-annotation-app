"use client"

import { useSWRGet, buildURL, useRequest } from "@/hooks/useRequest"
import type { AnnotationRow } from "@/lib/google-apis"
import type { AnnotationFormData } from "@/lib/validation"
import type { KeyedMutator } from "swr"

const EMPTY_ANN_ARR: AnnotationRow[] = []

export function useAnnotations(spreadsheetId?: string): {
  data: AnnotationRow[]
  error: unknown
  isLoading: boolean
  mutate: KeyedMutator<{ annotations: AnnotationRow[] }>
} {
  const key = spreadsheetId ? buildURL("/annotations", { spreadsheetId }) : null
  const { data, error, isLoading, mutate } = useSWRGet<{ annotations: AnnotationRow[] }>(key)
  return { data: data?.annotations ?? EMPTY_ANN_ARR, error, isLoading, mutate }
}

// Dedicated hook for regular annotation submissions
export function useCreateRegularAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean; warning?: string }>()

  const create = (payload: { spreadsheetId: string; annotation: AnnotationRow | AnnotationFormData }) => {
    return request.post("/annotations/regular", { ...payload, forceFormulateUpdate: true }, { retryAttempts: 0 })
  }

  return { create, loading, error, data }
}

// Dedicated hook for translation annotation submissions
export function useCreateTranslationAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean; warning?: string }>()

  const create = (payload: { spreadsheetId: string; annotation: AnnotationRow | AnnotationFormData }) => {
    return request.post("/annotations/translation", { ...payload, forceFormulateUpdate: false }, { retryAttempts: 0 })
  }

  return { create, loading, error, data }
}

// Backward-compat wrapper (optional)
export function useCreateAnnotation() {
  const { request, loading, error, data } = useRequest<{ success: boolean }>()

  const create = (payload: { spreadsheetId: string; annotation: AnnotationRow | AnnotationFormData }) => {
    const a: any = payload.annotation
    const isTranslation = !!(a.translation || a.translationLanguage || a.translationHausa || a.translationYoruba)
    const endpoint = isTranslation ? "/annotations/translation" : "/annotations/regular"
    return request.post(endpoint, { ...payload, forceFormulateUpdate: false }, { retryAttempts: 0 })
  }

  return { create, loading, error, data }
}
