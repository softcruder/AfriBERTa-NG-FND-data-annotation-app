import axios, { AxiosError } from "axios"

const requestService = axios.create({
  baseURL: "/api",
  timeout: 20000,
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

    // If the request was explicitly canceled (navigation / component unmount), do NOT retry.
    // Retrying a canceled successful POST was causing duplicate submissions (first completed server-side, second hit 409).
    if ((error as any).code === "ERR_CANCELED" || axios.isCancel?.(error)) {
      return Promise.reject(error)
    }

    // Network/timeout or 5xx: retry with backoff up to 2 times (exclude client aborts above)
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
        // Session refresh failed, redirect to login only if not already there
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/?error=session_expired"
        }
        // Still reject to prevent further processing
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export default requestService
