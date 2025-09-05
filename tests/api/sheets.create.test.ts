import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as sheetsCreatePOST } from "@/app/api/sheets/create/route"
import { NextRequest } from "next/server"

// Auth: pass-through admin by default
vi.mock("@/lib/server-auth", () => ({
  requireSession: vi.fn(async () => ({ session: { accessToken: "t", user: { role: "admin" } } })),
}))

// External call stub
vi.mock("@/lib/google-apis", () => ({
  createAnnotationSheet: vi.fn(async () => "sheet123"),
}))

// Rate limit: disable in tests
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(async () => undefined),
}))

function makeReq(body?: string) {
  const headers = new Headers()
  const init: any = { method: "POST", headers }
  if (body !== undefined) init.body = body
  return new NextRequest(new URL("http://localhost/api/sheets/create"), init)
}

describe("/api/sheets/create validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for invalid JSON body", async () => {
    const res = await sheetsCreatePOST(makeReq("{invalid"))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid request/)
  })

  it("returns 400 when title is missing", async () => {
    const res = await sheetsCreatePOST(makeReq(JSON.stringify({})))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Title is required/)
    expect(json.message).toMatch(/Invalid request/)
  })

  it("returns 200 with spreadsheetId when valid", async () => {
    const res = await sheetsCreatePOST(makeReq(JSON.stringify({ title: "Demo" })))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.spreadsheetId).toBe("sheet123")
  })
})
