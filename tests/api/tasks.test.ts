import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET as tasksGET } from "@/app/api/tasks/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth", () => ({
  getSessionFromCookie: vi.fn(() => ({
    accessToken: "token",
    user: { email: "admin@example.com" },
  })),
}))

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(() => null), // Always allow requests in tests
}))

vi.mock("@/lib/google-apis", () => ({
  getAppConfig: vi.fn(async () => ({ CSV_FILE_ID: "csv123" })),
  downloadCSVFile: vi.fn(async () => [
    ["col1", "col2"],
    ["a1", "b1"],
    ["a2", "b2"],
    ["a3", "b3"],
  ]),
  getAnnotations: vi.fn(async () => []),
}))

function makeRequest(url: string) {
  const headers = new Headers()
  headers.set("cookie", "auth_session=stub")
  return new NextRequest(new URL(url), { headers })
}

describe("/api/tasks GET", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear caches between tests
    const { csvCache, annotationCache } = await import("@/app/api/tasks/cache")
    csvCache.clear()
    annotationCache.clear()
  })

  it("returns paged items", async () => {
    const req = makeRequest("http://localhost/api/tasks?page=1&pageSize=2")
    const res = await tasksGET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.total).toBe(3)
    expect(json.items).toHaveLength(2)
    expect(json.items[0]).toHaveProperty("data")
  })

  it("handles missing config file id", async () => {
    const { getAppConfig } = (await import("@/lib/google-apis")) as any
    getAppConfig.mockResolvedValueOnce({ CSV_FILE_ID: undefined })
    const req = makeRequest("http://localhost/api/tasks")
    const res = await tasksGET(req)
    expect(res.status).toBe(400)
  })

  // Test cases for new error handling
  describe("CSV validation errors", () => {
    it("handles empty CSV data", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockResolvedValueOnce([])
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid or empty CSV file")
    })

    it("handles invalid CSV data format", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockResolvedValueOnce(null)
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid or empty CSV file")
    })

    it("handles missing CSV header", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockResolvedValueOnce([[], ["a1", "b1"]])
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("CSV header is missing or invalid")
    })

    it("handles inconsistent row structure", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockResolvedValueOnce([
        ["col1", "col2"],
        ["a1", "b1"],
        ["a2"], // Missing column
        ["a3", "b3", "c3"], // Extra column
      ])
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("CSV structure validation failed")
      expect(json.details).toContain("rows: 3, 4")
      expect(json.invalidRowCount).toBe(2)
    })
  })

  describe("Google API error handling", () => {
    it("handles quota exceeded error in getAppConfig", async () => {
      const { getAppConfig } = (await import("@/lib/google-apis")) as any
      getAppConfig.mockRejectedValueOnce(new Error("quota exceeded"))
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.error).toBe("Google API quota exceeded")
      expect(json.retryAfter).toBe(60)
    })

    it("handles permission denied error in getAppConfig", async () => {
      const { getAppConfig } = (await import("@/lib/google-apis")) as any
      getAppConfig.mockRejectedValueOnce(new Error("403 permission denied"))
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe("Access denied to configuration spreadsheet")
    })

    it("handles CSV file not found error", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockRejectedValueOnce(new Error("404 not found"))
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe("CSV file not found")
    })

    it("handles quota exceeded error in downloadCSVFile", async () => {
      const { downloadCSVFile } = (await import("@/lib/google-apis")) as any
      downloadCSVFile.mockRejectedValueOnce(new Error("rate limit exceeded"))
      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(429)
      const json = await res.json()
      expect(json.error).toBe("Google API quota exceeded")
      expect(json.details).toContain("CSV download failed")
    })

    it("continues when annotations fetch fails", async () => {
      const { getAppConfig, getAnnotations } = (await import("@/lib/google-apis")) as any
      getAppConfig.mockResolvedValueOnce({
        CSV_FILE_ID: "csv123",
        ANNOTATION_SPREADSHEET_ID: "sheet123",
      })
      getAnnotations.mockRejectedValueOnce(new Error("quota exceeded"))

      const req = makeRequest("http://localhost/api/tasks")
      const res = await tasksGET(req)
      expect(res.status).toBe(200) // Should continue despite annotation error
      const json = await res.json()
      expect(json.total).toBe(3) // All items returned since filtering failed
    })
  })

  describe("input validation", () => {
    it("handles invalid page parameter", async () => {
      const req = makeRequest("http://localhost/api/tasks?page=invalid")
      const res = await tasksGET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid page parameter")
    })
  })
})
