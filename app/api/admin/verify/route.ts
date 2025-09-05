import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { updateAnnotationStatus } from "@/lib/google-apis"
import { z } from "zod"

const AdminVerifySchema = z.object({
  spreadsheetId: z.string(),
  rowId: z.string(),
  action: z.enum(["approve", "needs-revision", "mark-invalid"]),
  comments: z.string().optional(),
  invalidityReason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { response, session } = await requireSession(request, { role: "admin" })
    if (response) return response
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { spreadsheetId, rowId, action, comments, invalidityReason } = AdminVerifySchema.parse(body)

    // Determine the new status and updates based on action
    let status: string
    let updates: any = {
      adminComments: comments,
    }

    switch (action) {
      case "approve":
        status = "approved"
        updates.status = status
        break
      case "needs-revision":
        status = "needs-revision"
        updates.status = status
        break
      case "mark-invalid":
        status = "invalid"
        updates.status = status
        updates.isValid = false
        updates.invalidityReason = invalidityReason
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update the annotation status
    await updateAnnotationStatus(session.accessToken, spreadsheetId, rowId, updates)

    return NextResponse.json({
      success: true,
      message: `Annotation ${action === "mark-invalid" ? "marked as invalid" : action === "approve" ? "approved" : "sent for revision"}`,
    })
  } catch (error) {
    console.error("Admin verify error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
