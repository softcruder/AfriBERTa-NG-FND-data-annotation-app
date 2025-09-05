import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { VerifyOnePage } from "@/components/verify-one-page"

export default async function AdminVerifyPage({ params }: { params: Promise<{ id?: string }> }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  const { id: rawId } = await params
  const id = rawId ? decodeURIComponent(rawId) : ""
  if (!id) redirect("/dashboard/admin/verify")
  return <VerifyOnePage id={id} />
}
