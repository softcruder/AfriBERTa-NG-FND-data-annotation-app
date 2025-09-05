import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as verifyPOST } from "@/app/api/qa/verify/route"
import { NextRequest } from "next/server"

// Mock the server auth module - that's what the route actually uses
vi.mock("@/lib/server-auth", () => ({
  requireSession: vi.fn().mockResolvedValue({
    response: null,
    session: {
      user: { id: "annotator1", email: "annotator@example.com", role: "annotator" },
      accessToken: "token",
    },
  }),
}))

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}))

const updateMock = vi.fn()
const getAnnotationsMock = vi.fn()
const createFinalDatasetEntriesMock = vi.fn()
const getAppConfigMock = vi.fn()
const downloadCSVFileMock = vi.fn()
const updatePaymentFormulasMock = vi.fn()

vi.mock("@/lib/google-apis", () => ({
  updateAnnotationStatus: (...args: any[]) => updateMock(...args),
  getAnnotations: (...args: any[]) => getAnnotationsMock(...args),
  createFinalDatasetEntries: (...args: any[]) => createFinalDatasetEntriesMock(...args),
  getAppConfig: (...args: any[]) => getAppConfigMock(...args),
  downloadCSVFile: (...args: any[]) => downloadCSVFileMock(...args),
  updatePaymentFormulas: (...args: any[]) => updatePaymentFormulasMock(...args),
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
    // Mock a different annotation to prevent self-verification error
    getAnnotationsMock.mockResolvedValue([
      {
        rowId: "5",
        annotatorId: "different-user",
        status: "completed",
        annotation: {},
        csvRow: { data: [] },
      },
    ])
  })

  it("verifies successfully", async () => {
    updateMock.mockResolvedValueOnce(undefined)
    const req = makeRequest({
      spreadsheetId: "sheet1",
      rowId: "5",
      qaComments: "Looks good",
      isApproved: true,
    })
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
    const req = makeRequest({
      spreadsheetId: "sheet1",
      rowId: "5",
      qaComments: "Error test",
      isApproved: true,
    })
    const res = await verifyPOST(req)
    expect(res.status).toBe(500)
  })
})
