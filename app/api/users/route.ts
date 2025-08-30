import { type NextRequest, NextResponse } from "next/server"
import { getUsers, addUser, updateUser, type User } from "@/lib/google-apis"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "users:GET" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get("spreadsheetId")

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    const users = await getUsers(session!.accessToken, spreadsheetId)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error getting users:", error)
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "users:POST" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { spreadsheetId, user } = await request.json()

    if (!spreadsheetId || !user) {
      return NextResponse.json({ error: "Spreadsheet ID and user data are required" }, { status: 400 })
    }

    await addUser(session!.accessToken, spreadsheetId, user)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding user:", error)
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const limited = await enforceRateLimit(request, { route: "users:PATCH" })
  if (limited) return limited
  try {
    const { response, session } = await requireSession(request)
    if (response) return response

    const { spreadsheetId, userId, updates } = await request.json()

    if (!spreadsheetId || !userId || !updates) {
      return NextResponse.json({ error: "Spreadsheet ID, user ID, and updates are required" }, { status: 400 })
    }

    await updateUser(session!.accessToken, spreadsheetId, userId, updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
