import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionFromCookie } from "@/lib/auth"
import { AnnotateTaskPage } from "@/components/annotate-task-page"

export default async function AnnotatorAnnotatePage({ params }: { params: { rowId: string } }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")
  if (!sessionCookie) redirect("/")
  const session = getSessionFromCookie(sessionCookie.value)
  if (!session) redirect("/")
  if (session.user.role !== "annotator") redirect("/dashboard")
  return <AnnotateTaskPage rowId={decodeURIComponent(params.rowId)} role="annotator" />
}
