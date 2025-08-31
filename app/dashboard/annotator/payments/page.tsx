import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { PaymentDashboard } from "@/components/payment-dashboard"

export default async function AnnotatorPaymentsPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "annotator") redirect("/dashboard")
  return (
    <div className="container mx-auto p-6">
      <PaymentDashboard user={session.user} />
    </div>
  )
}
