import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { AnnotatorDashboard } from "@/components/annotator-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { getSessionFromCookie } from "@/lib/auth"

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")

  if (!sessionCookie) {
    return null
  }

  return getSessionFromCookie(sessionCookie.value)
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-background">
      {user.role === "admin" ? <AdminDashboard user={user} /> : <AnnotatorDashboard user={user} />}
    </div>
  )
}
