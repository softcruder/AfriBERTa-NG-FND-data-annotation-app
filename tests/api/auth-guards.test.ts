import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as exportPOST } from "@/app/api/export/route"
import { POST as sheetsCreatePOST } from "@/app/api/sheets/create/route"
import { GET as driveCsvGET } from "@/app/api/drive/csv/[fileId]/route"
import { GET as tasksGET } from "@/app/api/tasks/route"
import { NextRequest } from "next/server"

// Mock server-auth to control auth outcomes per test
vi.mock("@/lib/server-auth", () => ({
  requireSession: vi.fn(async (_req: NextRequest, opts?: { role?: "annotator" | "admin" }) => {
    // Default: unauthenticated; override in tests by spying
    return { response: new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 }) }
  }),
}))

// Minimal mocks to avoid hitting external libs
vi.mock("@/lib/google-apis", () => ({
  downloadCSVFile: vi.fn(async () => [["h1"], ["r1"]]),
  createAnnotationSheet: vi.fn(async () => "sheet123"),
  getAppConfig: vi.fn(async () => ({ CSV_FILE_ID: "csv123" })),
  initializeGoogleAPIs: vi.fn(() => ({ drive: {}, sheets: {}, auth: {} })),
}))

function makeReq(url: string, cookie?: string, init?: { method?: string; body?: any }) {
  const headers = new Headers()
  if (cookie) headers.set("cookie", cookie)
  if (init?.body && typeof init.body !== "string") {
    init.body = JSON.stringify(init.body)
  }
  return new NextRequest(new URL(url), { headers, method: init?.method, body: init?.body })
}

describe("auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("/api/export POST returns 401 when unauthenticated", async () => {
    const req = makeReq("http://localhost/api/export", undefined, { method: "POST", body: { format: "json" } })
    const res = await exportPOST(req)
    expect(res.status).toBe(401)
  })

  it("/api/sheets/create POST returns 403 for non-admin", async () => {
    const { requireSession } = (await import("@/lib/server-auth")) as any
    requireSession.mockResolvedValueOnce({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 }),
    })
    const req = makeReq("http://localhost/api/sheets/create", undefined, { method: "POST", body: { title: "Demo" } })
    const res = await sheetsCreatePOST(req)
    expect(res.status).toBe(403)
  })

  it("/api/drive/csv/[fileId] GET returns 200 for authenticated user", async () => {
    const { requireSession } = (await import("@/lib/server-auth")) as any
    requireSession.mockResolvedValueOnce({ session: { accessToken: "t", user: { role: "annotator" } } })
    const req = makeReq("http://localhost/api/drive/csv/abc")
    const res = await driveCsvGET(req, { params: Promise.resolve({ fileId: "abc" }) })
    expect(res.status).toBe(200)
  })

  it("/api/tasks GET returns 200 for authenticated user", async () => {
    const { requireSession } = (await import("@/lib/server-auth")) as any
    requireSession.mockResolvedValueOnce({ session: { accessToken: "t", user: { id: "u1" } } })
    const req = makeReq("http://localhost/api/tasks")
    const res = await tasksGET(req)
    expect(res.status).toBe(200)
  })
})
