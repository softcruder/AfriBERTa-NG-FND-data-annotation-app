import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { AnnotationMonitoring } from "@/components/annotation-monitoring"

export default async function AdminMetricsPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  return (
    <div className="container mx-auto p-6">
      <AnnotationMonitoring />
    </div>
  )
}
