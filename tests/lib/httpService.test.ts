import { describe, it, expect, vi, beforeEach } from "vitest"
import httpService, { httpEvents, __rawHttpAxiosInstance } from "@/services/httpService"
import type { AxiosRequestConfig, AxiosResponse } from "axios"

// Use the exposed raw axios instance for adapter override
const internalInstance = __rawHttpAxiosInstance

type MockHandler = (
  config: AxiosRequestConfig,
) => Promise<AxiosResponse | { status: number; data?: any; headers?: any }>
const routes: Record<string, MockHandler> = {}

function key(method: string, url?: string) {
  return `${method.toUpperCase()} ${url}`
}

function register(method: string, url: string, handler: MockHandler) {
  routes[key(method, url)] = handler
}

internalInstance.defaults.adapter = async (config: AxiosRequestConfig) => {
  const route = routes[key(config.method || "GET", config.url)]
  if (!route) return Promise.reject({ isAxiosError: true, config, response: { status: 404 } })
  const res = await route(config)
  const status = (res as any).status
  const data = (res as any).data
  if (status >= 400) return Promise.reject({ isAxiosError: true, config, response: { status, data } })
  return { status, data, config, headers: {}, statusText: String(status) } as AxiosResponse
}

describe("httpService (custom adapter)", () => {
  beforeEach(() => {
    for (const k of Object.keys(routes)) delete routes[k]
  })

  it("retries idempotent GET requests on 500 up to max attempts then succeeds", async () => {
    const calls: number[] = []
    register("get", "/test-retry", async () => {
      calls.push(Date.now())
      if (calls.length < 3) return { status: 500, data: { failed: calls.length } }
      return { status: 200, data: { ok: true, attempts: calls.length } }
    })
    const res = await httpService.get("/test-retry")
    expect((res as any).data.ok).toBe(true)
    expect((res as any).data.attempts).toBe(3)
  })

  it("does not retry non-idempotent POST requests on 500", async () => {
    let count = 0
    register("post", "/test-post", async () => {
      count += 1
      return { status: 500, data: { error: true } }
    })
    await expect(httpService.post("/test-post", { a: 1 })).rejects.toBeDefined()
    expect(count).toBe(1)
  })

  it("emits unauthorized event after refresh failure", async () => {
    const unauthorizedSpy = vi.fn()
    const refreshFailedSpy = vi.fn()
    const unsub1 = httpEvents.onUnauthorized(unauthorizedSpy)
    const unsub2 = httpEvents.onRefreshFailed(refreshFailedSpy)

    // Refresh endpoint fails
    register("post", "auth/refresh", async () => ({ status: 500 }))
    register("post", "/auth/refresh", async () => ({ status: 500 }))
    // Original request returns 401
    register("get", "/secure", async () => ({ status: 401 }))

    await expect(httpService.get("/secure")).rejects.toBeDefined()
    expect(refreshFailedSpy).toHaveBeenCalledTimes(1)
    expect(unauthorizedSpy).toHaveBeenCalledTimes(1)
    unsub1()
    unsub2()
  })

  it("replays original request after successful refresh", async () => {
    let refreshCalls = 0
    let first = true
    register("post", "auth/refresh", async () => {
      refreshCalls += 1
      return { status: 200 }
    })
    register("post", "/auth/refresh", async () => {
      refreshCalls += 1
      return { status: 200 }
    })
    register("get", "/needs-refresh", async () => {
      if (first) {
        first = false
        return { status: 401 }
      }
      return { status: 200, data: { success: true } }
    })
    const res = await httpService.get("/needs-refresh")
    expect((res as any).data.success).toBe(true)
    expect(refreshCalls).toBe(1)
  })
})
