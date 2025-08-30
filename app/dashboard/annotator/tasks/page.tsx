import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { TasksListPage } from "@/components/tasks-list-page"

export default async function AnnotatorTasksPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "annotator") redirect("/dashboard")
  return <TasksListPage basePath="/dashboard/annotator" />
}
