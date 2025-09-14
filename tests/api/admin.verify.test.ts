import { describe, it, expect, vi } from "vitest"
import { POST } from "@/app/api/admin/verify/route"
import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import {
  updateAnnotationStatus,
  getAnnotations,
  getAppConfig,
  finalDatasetHasId,
  downloadCSVFile,
  createFinalDatasetEntries,
  updatePaymentFormulas,
} from "@/lib/google-apis"

// Mock dependencies
vi.mock("@/lib/server-auth")
vi.mock("@/lib/google-apis")

const mockRequireSession = vi.mocked(requireSession)
const mockUpdateAnnotationStatus = vi.mocked(updateAnnotationStatus)
const mockGetAnnotations = vi.mocked(getAnnotations)
const mockGetAppConfig = vi.mocked(getAppConfig)
const mockFinalDatasetHasId = vi.mocked(finalDatasetHasId)
const mockDownloadCSVFile = vi.mocked(downloadCSVFile)
const mockCreateFinalDatasetEntries = vi.mocked(createFinalDatasetEntries)
const mockUpdatePaymentFormulas = vi.mocked(updatePaymentFormulas)

function makeReq(url: string, body?: any): NextRequest {
  return new NextRequest(new URL(url), {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  } as any)
}

describe("/api/admin/verify", () => {
  it("returns 401 when not authenticated", async () => {
    mockRequireSession.mockResolvedValue({ response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) })

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "approve",
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 403 when user is not admin", async () => {
    mockRequireSession.mockResolvedValue({ response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) })

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "approve",
    })
    const res = await POST(req)

    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid action", async () => {
    mockRequireSession.mockResolvedValue({
      session: {
        user: { id: "admin1", role: "admin", email: "admin@test.com", name: "Admin" },
        accessToken: "token123",
        expiresAt: Date.now() + 3600000,
      },
    })

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "invalid-action",
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("successfully approves and finalizes annotation (creates final dataset entry)", async () => {
    mockRequireSession.mockResolvedValue({
      session: {
        user: { id: "admin1", role: "admin", email: "admin@test.com", name: "Admin" },
        accessToken: "token123",
        expiresAt: Date.now() + 3600000,
      },
    })
    mockUpdateAnnotationStatus.mockResolvedValue()
    mockGetAnnotations.mockResolvedValue([
      {
        rowId: "row1",
        annotatorId: "annA",
        claimText: "Claim text",
        sourceLinks: ["http://example.com"],
        startTime: new Date().toISOString(),
        status: "completed",
      },
    ] as any)
    mockGetAppConfig.mockResolvedValue({ FINAL_DATASET_SPREADSHEET_ID: "final123", CSV_FILE_ID: "csv999" } as any)
    mockFinalDatasetHasId.mockResolvedValue(false)
    mockDownloadCSVFile.mockResolvedValue([
      ["row1", "some", "csv", "data"],
      ["rowX", "other"],
    ] as any)
    mockCreateFinalDatasetEntries.mockResolvedValue()
    mockUpdatePaymentFormulas.mockResolvedValue()

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "approve",
      comments: "Looks good",
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toMatch(/finalized/)

    // Status should now be verified (final state)
    expect(mockUpdateAnnotationStatus).toHaveBeenCalledWith("token123", "123", "row1", {
      status: "verified",
      adminComments: "Looks good",
    })
    // Final dataset workflow executed
    expect(mockGetAnnotations).toHaveBeenCalled()
    expect(mockGetAppConfig).toHaveBeenCalled()
    expect(mockFinalDatasetHasId).toHaveBeenCalledWith("token123", "final123", "row1")
    expect(mockCreateFinalDatasetEntries).toHaveBeenCalled()
    expect(mockUpdatePaymentFormulas).toHaveBeenCalledWith("token123", "123")
  })

  it("skips dataset append if already exists", async () => {
    mockRequireSession.mockResolvedValue({
      session: {
        user: { id: "admin1", role: "admin", email: "admin@test.com", name: "Admin" },
        accessToken: "token123",
        expiresAt: Date.now() + 3600000,
      },
    })
    mockUpdateAnnotationStatus.mockResolvedValue()
    mockGetAnnotations.mockResolvedValue([
      {
        rowId: "row1",
        annotatorId: "annA",
        claimText: "Claim text",
        sourceLinks: ["http://example.com"],
        startTime: new Date().toISOString(),
        status: "completed",
      },
    ] as any)
    mockGetAppConfig.mockResolvedValue({ FINAL_DATASET_SPREADSHEET_ID: "final123" } as any)
    mockFinalDatasetHasId.mockResolvedValue(true)
    mockCreateFinalDatasetEntries.mockResolvedValue()
    mockUpdatePaymentFormulas.mockResolvedValue()

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "approve",
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockCreateFinalDatasetEntries).not.toHaveBeenCalled()
  })

  it("successfully marks annotation as invalid", async () => {
    mockRequireSession.mockResolvedValue({
      session: {
        user: { id: "admin1", role: "admin", email: "admin@test.com", name: "Admin" },
        accessToken: "token123",
        expiresAt: Date.now() + 3600000,
      },
    })
    mockUpdateAnnotationStatus.mockResolvedValue()

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "mark-invalid",
      comments: "Poor quality",
      invalidityReason: "Incorrect classification",
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toMatch(/invalid/)

    expect(mockUpdateAnnotationStatus).toHaveBeenCalledWith("token123", "123", "row1", {
      status: "invalid",
      adminComments: "Poor quality",
      isValid: false,
      invalidityReason: "Incorrect classification",
    })
  })

  it("successfully sends annotation for revision", async () => {
    mockRequireSession.mockResolvedValue({
      session: {
        user: { id: "admin1", role: "admin", email: "admin@test.com", name: "Admin" },
        accessToken: "token123",
        expiresAt: Date.now() + 3600000,
      },
    })
    mockUpdateAnnotationStatus.mockResolvedValue()

    const req = makeReq("http://localhost/api/admin/verify", {
      spreadsheetId: "123",
      rowId: "row1",
      action: "needs-revision",
      comments: "Please fix the verdict",
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toMatch(/revision/)

    expect(mockUpdateAnnotationStatus).toHaveBeenCalledWith("token123", "123", "row1", {
      status: "needs-revision",
      adminComments: "Please fix the verdict",
    })
  })
})
