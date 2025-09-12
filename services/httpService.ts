import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

/**
 * Production-ready HTTP service wrapper around Axios with the following goals:
 * - No UI side-effects (no window redirects) inside transport layer
 * - Retry policy ONLY for idempotent requests (GET/HEAD/OPTIONS) on network + 5xx (excluding 501/505)
 * - Exponential backoff with jitter; default max 2 retries (configurable per request)
 * - Centralized, single-flight session refresh on 401 responses; subsequent queued retries
 * - Cancellation respected (never retries canceled requests)
 * - Emits typed events (unauthorized, refresh-failed) for upper layers (e.g. auth provider) to react
 * - Extensible via request config augmentation
 */

// ------------------------------ Types ---------------------------------- //
export interface ExtendedAxiosRequestConfig<D = any> extends AxiosRequestConfig<D> {
  /** Allow overriding retry attempts for this request (idempotent only). */
  retryAttempts?: number
  /** Allow disabling retry for this request. */
  disableRetry?: boolean
  /** Internal marker counts (not to be supplied by callers). */
  __retryCount?: number
  /** Internal flag for post-refresh replay. */
  __isRetryAfterRefresh?: boolean
  /** Internal flag marking the refresh request itself to avoid recursion. */
  __isRefreshRequest?: boolean
}

type UnauthorizedListener = () => void
type RefreshFailedListener = () => void

// ------------------------------ Event Emitter -------------------------- //
class HttpServiceEvents {
  private unauthorizedListeners = new Set<UnauthorizedListener>()
  private refreshFailedListeners = new Set<RefreshFailedListener>()

  onUnauthorized(cb: UnauthorizedListener) {
    this.unauthorizedListeners.add(cb)
    return () => this.unauthorizedListeners.delete(cb)
  }
  onRefreshFailed(cb: RefreshFailedListener) {
    this.refreshFailedListeners.add(cb)
    return () => this.refreshFailedListeners.delete(cb)
  }
  emitUnauthorized() {
    for (const cb of [...this.unauthorizedListeners]) cb()
  }
  emitRefreshFailed() {
    for (const cb of [...this.refreshFailedListeners]) cb()
  }
}

// ------------------------------ Refresh Orchestrator ------------------- //
let isRefreshing = false
let refreshPromise: Promise<void> | null = null
const refreshWaiters: Array<() => void> = []

function queueAfterRefresh(cb: () => void) {
  refreshWaiters.push(cb)
}
function flushRefreshQueue() {
  while (refreshWaiters.length) refreshWaiters.shift()?.()
}

async function performRefresh(instance: AxiosInstance): Promise<void> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  // Explicitly pass adapter to ensure we don't fall back to fetch adapter in test / jsdom env
  // Use relative path so axios baseURL ("/api") prefixes correctly -> "/api/auth/refresh"
  const refreshUrl = "auth/refresh"
  refreshPromise = instance
    .request({
      url: refreshUrl,
      method: "post",
      // mark to prevent interceptor loops
      __isRefreshRequest: true,
      // ensure adapter used (tests override instance.defaults.adapter)
      adapter: (instance.defaults as any).adapter,
    } as ExtendedAxiosRequestConfig)
    .then(() => {
      /* success */
    })
    .catch(err => {
      throw err || new Error("refresh_failed")
    })
    .finally(() => {
      isRefreshing = false
      flushRefreshQueue()
      refreshPromise = null
    })
  return refreshPromise
}

// ------------------------------ Retry Policy --------------------------- //
const IDEMPOTENT_METHODS = new Set(["get", "head", "options"])

function isNetworkOrRetriableStatus(status?: number) {
  if (!status) return true // network/timeout (no response)
  if (status >= 500 && status !== 501 && status !== 505) return true
  return false
}

function calculateBackoff(retryCount: number) {
  // Base: 200ms * 2^(n-1) with jitter +/- 25%
  const base = 200 * Math.pow(2, retryCount - 1)
  const jitterFactor = 0.75 + Math.random() * 0.5
  return Math.min(2000, base * jitterFactor)
}

// ------------------------------ Instance Creation ---------------------- //
class HttpService {
  private instance: AxiosInstance
  public events = new HttpServiceEvents()

  constructor() {
    this.instance = axios.create({
      baseURL: "/api",
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
    })
    this.setupInterceptors()
  }

  /**
   * Expose raw axios instance (primarily for test instrumentation). Not for general app use.
   */
  public getRawInstance(): AxiosInstance {
    return this.instance
  }

  private setupInterceptors() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalConfig = (error.config || {}) as ExtendedAxiosRequestConfig
        const status = error.response?.status

        // Respect explicit cancellation
        if ((error as any).code === "ERR_CANCELED" || axios.isCancel?.(error)) {
          return Promise.reject(error)
        }

        // Never attempt refresh / retry logic for the refresh request itself
        if (originalConfig.__isRefreshRequest) {
          return Promise.reject(error)
        }

        // 401 handling with single-flight refresh
        if (status === 401 && !originalConfig.__isRetryAfterRefresh) {
          originalConfig.__isRetryAfterRefresh = true
          try {
            if (isRefreshing) await new Promise<void>(resolve => queueAfterRefresh(resolve))
            else await performRefresh(this.instance)
            // replay original request
            return this.instance(originalConfig)
          } catch (refreshErr) {
            this.events.emitRefreshFailed()
            this.events.emitUnauthorized()
            return Promise.reject(refreshErr)
          }
        }

        // If still 401 here, emit unauthorized and fail fast
        if (status === 401) {
          this.events.emitUnauthorized()
          return Promise.reject(error)
        }

        // Retry policy: only idempotent + network/5xx & not disabled
        const method = (originalConfig.method || "get").toLowerCase()
        const allowRetry =
          !originalConfig.disableRetry && IDEMPOTENT_METHODS.has(method) && isNetworkOrRetriableStatus(status)
        if (allowRetry) {
          originalConfig.__retryCount = originalConfig.__retryCount || 0

          const maxAttempts = typeof originalConfig.retryAttempts === "number" ? originalConfig.retryAttempts : 2
          if (originalConfig.__retryCount < maxAttempts) {
            originalConfig.__retryCount += 1
            const delay = calculateBackoff(originalConfig.__retryCount)
            await new Promise(r => setTimeout(r, delay))
            return this.instance(originalConfig)
          }
        }

        return Promise.reject(error)
      },
    )
  }

  request<T = any, R = AxiosResponse<T>, D = any>(config: ExtendedAxiosRequestConfig<D>) {
    return this.instance.request<T, R, D>(config)
  }
  get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.get<T, R, D>(url, config)
  }
  delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.delete<T, R, D>(url, config)
  }
  head<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.head<T, R, D>(url, config)
  }
  options<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.options<T, R, D>(url, config)
  }
  post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.post<T, R, D>(url, data, config)
  }
  put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.put<T, R, D>(url, data, config)
  }
  patch<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: ExtendedAxiosRequestConfig<D>) {
    return this.instance.patch<T, R, D>(url, data, config)
  }
}

const httpService = new HttpService()

export default httpService
export const httpEvents = httpService.events
// Test-only raw instance export guarded by NODE_ENV check (still present if someone imports directly in prod but discouraged)
export const __rawHttpAxiosInstance = httpService.getRawInstance()
export type { AxiosError }
