import { useState } from "react"
import useSWR, { type SWRConfiguration, type Key } from "swr"
import requestService from "@/services/httpService"
import { AxiosRequestConfig, AxiosResponse } from "axios"

export function useRequest<T = any, E = any>() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<E | null>(null)
  const [data, setData] = useState<T | null>(null)

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
    get: (url: string, config?: AxiosRequestConfig) => handleRequest(requestService.get<T>(url, config)),
    post: (url: string, data?: any, config?: AxiosRequestConfig) =>
      handleRequest(requestService.post<T>(url, data, config)),
    put: (url: string, data?: any, config?: AxiosRequestConfig) =>
      handleRequest(requestService.put<T>(url, data, config)),
    patch: (url: string, data?: any, config?: AxiosRequestConfig) =>
      handleRequest(requestService.patch<T>(url, data, config)),
    delete: (url: string, config?: AxiosRequestConfig) => handleRequest(requestService.delete<T>(url, config)),
    send: (config: AxiosRequestConfig) => handleRequest(requestService.request<T>(config)),
  }

  return { loading, error, data, request }
}

// Generic axios-backed fetcher for SWR GET requests
async function swrFetcher<T = any>(url: string): Promise<T> {
  const res = await requestService.get<T>(url)
  return res.data
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

// SWR GET hook: uses axios under the hood via swrFetcher
export function useSWRGet<T = any>(key: Key | null, swrKeyToUrl?: (key: Key) => string, options?: SWRConfiguration<T>) {
  const getUrl = (k: Key) => (swrKeyToUrl ? swrKeyToUrl(k) : (k as string))
  const resp = useSWR<T>(key, (k: Key) => swrFetcher<T>(getUrl(k)), {
    revalidateOnFocus: true,
    shouldRetryOnError: true,
    ...options,
  })
  return resp
}
