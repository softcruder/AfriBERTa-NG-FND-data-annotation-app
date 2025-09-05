import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { DataConfiguration } from "@/components/data-configuration"

export default async function AdminConfigsPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  return (
    <div className="container mx-auto p-6">
      <DataConfiguration />
    </div>
  )
}
