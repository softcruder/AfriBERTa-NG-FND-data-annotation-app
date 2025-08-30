import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminIndexPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  return <AdminDashboard user={session.user} />
}
