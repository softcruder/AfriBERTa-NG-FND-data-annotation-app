import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { PaymentOverview } from "@/components/payment-overview"

export default async function AdminPaymentsPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  return (
    <div className="container mx-auto p-6">
      <PaymentOverview />
    </div>
  )
}
