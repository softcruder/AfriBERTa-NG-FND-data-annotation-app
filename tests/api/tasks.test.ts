import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET as tasksGET } from "@/app/api/tasks/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth", () => ({
  getSessionFromCookie: vi.fn(() => ({
    accessToken: "token",
    user: { email: "admin@example.com" },
  })),
}))

vi.mock("@/lib/google-apis", () => ({
  getAppConfig: vi.fn(async () => ({ CSV_FILE_ID: "csv123" })),
  downloadCSVFile: vi.fn(async () => [
    ["col1", "col2"],
    ["a1", "b1"],
    ["a2", "b2"],
    ["a3", "b3"],
  ]),
}))

function makeRequest(url: string) {
  const headers = new Headers()
  headers.set("cookie", "auth_session=stub")
  return new NextRequest(new URL(url), { headers })
}

describe("/api/tasks GET", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
