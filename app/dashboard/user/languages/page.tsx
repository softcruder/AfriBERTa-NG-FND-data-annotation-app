import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { LanguageManagementPage } from "@/components/language-management-page"

export default async function UserLanguagesPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")

  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")

  return <LanguageManagementPage />
}
