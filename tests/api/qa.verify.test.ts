import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as verifyPOST } from "@/app/api/qa/verify/route"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth", () => ({
  getSessionFromCookie: vi.fn(() => ({
    accessToken: "token",
    user: { email: "qa@example.com" },
  })),
}))

const updateMock = vi.fn()
vi.mock("@/lib/google-apis", () => ({
  updateAnnotationStatus: (...args: any[]) => updateMock(...args),
}))

function makeRequest(body: any) {
  const headers = new Headers()
  headers.set("cookie", "auth_session=stub")
  return new NextRequest(new URL("http://localhost/api/qa/verify"), {
    headers,
    method: "POST",
    body: JSON.stringify(body),
  } as any)
}

describe("/api/qa/verify POST", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies successfully", async () => {
    updateMock.mockResolvedValueOnce(undefined)
    const req = makeRequest({ spreadsheetId: "sheet1", rowId: "5" })
    const res = await verifyPOST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(updateMock).toHaveBeenCalled()
  })

  it("returns 400 on missing params", async () => {
    const req = makeRequest({ spreadsheetId: "", rowId: "" })
    const res = await verifyPOST(req)
    expect(res.status).toBe(400)
  })

  it("returns 500 on update error", async () => {
    updateMock.mockRejectedValueOnce(new Error("boom"))
    const req = makeRequest({ spreadsheetId: "sheet1", rowId: "5" })
    const res = await verifyPOST(req)
    expect(res.status).toBe(500)
  })
})
