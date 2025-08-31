import axios, { AxiosError } from "axios"

const requestService = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Simple in-flight refresh control
let isRefreshing = false
let refreshPromise: Promise<void> | null = null
const subscribers: Array<() => void> = []
function subscribeTokenRefresh(cb: () => void) {
  subscribers.push(cb)
}
function onRefreshed() {
  while (subscribers.length) subscribers.shift()?.()
}

async function refreshSession() {
  if (isRefreshing) return refreshPromise!
  isRefreshing = true
  refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
    .then(async r => {
      if (!r.ok) throw new Error("refresh failed")
    })
    .finally(() => {
      isRefreshing = false
      onRefreshed()
      refreshPromise = null
    })
  return refreshPromise
}

// Response interceptor: handle 401 and retry once after refresh
requestService.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const config: any = error.config || {}
    const status = error.response?.status

    // Network/timeout or 5xx: retry with backoff up to 2 times
    const retriable = !status || status >= 500
    if (retriable) {
      config.__retryCount = config.__retryCount || 0
      if (config.__retryCount < 2) {
        config.__retryCount += 1
        const backoff = 200 * Math.pow(2, config.__retryCount - 1)
        await new Promise(r => setTimeout(r, backoff))
        return requestService(config)
      }
    }

    if (status === 401 && !config.__isRetryAfterRefresh) {
      config.__isRetryAfterRefresh = true
      try {
        await refreshSession()
        return requestService(config)
      } catch {
        // fallthrough to original error
      }
    }
    return Promise.reject(error)
  },
)

export default requestService
