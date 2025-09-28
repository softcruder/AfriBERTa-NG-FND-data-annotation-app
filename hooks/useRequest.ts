import { useState } from "react"
import useSWR, { type SWRConfiguration, type Key } from "swr"
import requestService, { ExtendedAxiosRequestConfig, httpEvents } from "@/services/httpService"
import { AxiosResponse } from "axios"

export function useRequest<T = any, E = any>() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<E | null>(null)
  const [data, setData] = useState<T | null>(null)

  // Subscribe once to unauthorized events (consumer components can decide how to redirect / logout)
  // We intentionally do NOT redirect here to keep hook side-effect-light; but we could expose a callback prop in future.
  // Example placeholder: clear local cache if needed.
  // NOTE: Avoid adding window navigation directly to maintain separation of concerns.
  // If required, an auth provider can also subscribe to httpEvents. This ensures no duplicate listeners per component.
  // (No cleanup complexity here because module-level singleton; but we can expose an unsubscribe via useEffect if needed.)
  // For safety we add a lazy subscription only once.
  if (typeof window !== "undefined" && !(window as any).__httpUnauthorizedSubscribed) {
    httpEvents.onUnauthorized(() => {
      // Mark a global flag; auth provider may watch storage events if desired.
      // console.debug("Received unauthorized event from http layer")
    })
    ;(window as any).__httpUnauthorizedSubscribed = true
  }

  const handleRequest = async (promise: Promise<AxiosResponse<T>>): Promise<T> => {
    setLoading(true)
    setError(null)
    try {
      const response = await promise
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err as E)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const request = {
    get: (url: string, config?: ExtendedAxiosRequestConfig) => handleRequest(requestService.get<T>(url, config)),
    post: (url: string, data?: any, config?: ExtendedAxiosRequestConfig) =>
      handleRequest(requestService.post<T>(url, data, config)),
    put: (url: string, data?: any, config?: ExtendedAxiosRequestConfig) =>
      handleRequest(requestService.put<T>(url, data, config)),
    patch: (url: string, data?: any, config?: ExtendedAxiosRequestConfig) =>
      handleRequest(requestService.patch<T>(url, data, config)),
    delete: (url: string, config?: ExtendedAxiosRequestConfig) => handleRequest(requestService.delete<T>(url, config)),
    send: (config: ExtendedAxiosRequestConfig) => handleRequest(requestService.request<T>(config)),
  }

  return { loading, error, data, request }
}

// Generic fetch()-backed fetcher for SWR GET requests
async function swrFetcher<T = any>(url: string): Promise<T> {
  const fullUrl = `/api/${url}`
  const res = await fetch(fullUrl, { credentials: "same-origin" })
  if (!res.ok) {
    // Handle authentication errors by redirecting to login
    if (res.status === 401) {
      // Only redirect if not already on the auth page
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.location.href = "/?error=session_expired"
      }
      throw new Error("Session expired")
    }

    // Try to parse error body for better diagnostics
    let details: unknown = undefined
    try {
      details = await res.json()
    } catch {
      // ignore body parse errors
    }
    const summary = typeof (details as any)?.error === "string" ? (details as any).error : undefined
    const extra = (details as any)?.details || (details as any)?.issues || (details as any)?.message
    const suffix = summary ? `: ${summary}` : ""
    const err = new Error(`SWR GET ${fullUrl} failed: ${res.status}${suffix}`)
    ;(err as any).status = res.status
    ;(err as any).details = details
    throw err
  }
  return (await res.json()) as T
}

// Helper to build URL with query params
export function buildURL(path: string, query?: Record<string, any>): string {
  if (!query || Object.keys(query).length === 0) return path
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    usp.set(k, String(v))
  }
  const qs = usp.toString()
  return qs ? `${path}?${qs}` : path
}

// SWR GET hook: uses fetch() under the hood via swrFetcher
export function useSWRGet<T = any>(key: string | null, options?: SWRConfiguration<T>) {
  const resp = useSWR<T>(key, swrFetcher, options)
  return resp
}
