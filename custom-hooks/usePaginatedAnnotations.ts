"use client"

import { useEffect } from "react"
import { useSWRGet, buildURL } from "@/hooks/useRequest"
import type { AnnotationRow } from "@/lib/google-apis"

export interface PaginatedAnnotationsResponse {
  items: AnnotationRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function usePaginatedAnnotations(spreadsheetId?: string, page = 1, pageSize = 20) {
  const key = spreadsheetId ? buildURL("/annotations/paginated", { spreadsheetId, page, pageSize }) : null
  const swr = useSWRGet<PaginatedAnnotationsResponse>(key, { revalidateOnFocus: false })

  // Prefetch next page to improve perceived speed
  useEffect(() => {
    const nextPage = page + 1
    if (!spreadsheetId || !swr?.data) return
    if (nextPage <= (swr.data.totalPages || 1)) {
      const url = buildURL("/annotations/paginated", { spreadsheetId, page: nextPage, pageSize })
      // Fire-and-forget prefetch via fetch; SWR will cache because it uses the same fetcher key
      fetch(`/api/${url}`, { credentials: "same-origin" }).catch(() => {})
    }
  }, [page, pageSize, spreadsheetId, swr?.data])

  return swr
}
