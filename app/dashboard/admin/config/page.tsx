import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { DataConfiguration } from "@/components/data-configuration"
import { PaymentConfiguration } from "@/components/payment-configuration"

export default async function AdminConfigPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "admin") redirect("/dashboard")
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">Manage application settings, data sources, and payment rates.</p>
      </div>

      <PaymentConfiguration />
      <DataConfiguration />
    </div>
  )
}
