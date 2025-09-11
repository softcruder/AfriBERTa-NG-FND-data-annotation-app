"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnnotationForm } from "@/components/annotation-form"
import type { AnnotationTask } from "@/lib/data-store"
import type { User as LibUser } from "@/lib/auth"
import { useAuth } from "@/custom-hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { useCreateAnnotation } from "@/custom-hooks/useAnnotations"

type Role = "annotator" | "admin"

interface AnnotateTaskPageProps {
  rowId: string // This is the CSV ID from column A
  role: Role
}

export function AnnotateTaskPage({ rowId, role }: AnnotateTaskPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, spreadsheetId, csvFileId } = useAuth()
  const [task, setTask] = useState<AnnotationTask | null>(null)
  const [loading, setLoading] = useState(true)
  const { create: createAnnotation } = useCreateAnnotation()

  const targetAfterComplete = useMemo(() => {
    const baseUrl = role === "admin" ? "/dashboard/admin" : "/dashboard/annotator/tasks"

    // Try to preserve the page number from the current URL or document referrer
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href)
      const referrerUrl = document.referrer ? new URL(document.referrer) : null

      // Check for page parameter in current URL or referrer
      const pageParam = currentUrl.searchParams.get("page") || referrerUrl?.searchParams.get("page")

      if (pageParam && pageParam !== "1") {
        return `${baseUrl}?page=${pageParam}`
      }
    }

    return baseUrl
  }, [role])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!csvFileId) {
          toast({ title: "Missing config", description: "CSV file not configured", variant: "destructive" })
          router.push(targetAfterComplete)
          return
        }

        // Fetch CSV from API and find the row by ID in the first column
        const res = await fetch(`/api/drive/csv/${encodeURIComponent(csvFileId)}`)
        if (!res.ok) throw new Error("Failed to load CSV")
        const json = (await res.json()) as { data: string[][] }
        const csv = json.data
        const header = csv?.[0]
        const targetId = (rowId || "").trim()
        const foundIndex = (csv || []).findIndex((r, i) => i > 0 && (r?.[0] || "").trim() === targetId)
        if (foundIndex === -1) throw new Error("Row not found in CSV by ID")
        const row = csv?.[foundIndex]
        if (!row || !Array.isArray(row)) throw new Error("Row not found in CSV")

        // Build initial AnnotationTask consistent with dashboard starter
        const extractedClaim = row[1] ?? ""
        const verdict = row[2] || ""
        const sourceUrl = row[7] || ""
        const claimLinks = row[5] || ""
        const linksArray = [sourceUrl, ...claimLinks.split(/;\s*/)].filter(Boolean)

        const newTask: AnnotationTask = {
          id: `task_${Date.now()}`,
          rowId,
          csvRow: { id: rowId, originalIndex: foundIndex, data: row, header },
          startTime: new Date(),
          claims: [extractedClaim],
          sourceLinks: linksArray.length ? linksArray : [""],
          verdict,
          status: "in-progress",
        }

        if (!cancelled) setTask(newTask)
      } catch (e) {
        if (!cancelled) {
          toast({ title: "Load failed", description: "Could not load the selected row", variant: "destructive" })
          router.push(targetAfterComplete)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [rowId, router, targetAfterComplete, toast, csvFileId])

  if (!user) return null
  const libUser = user as unknown as LibUser

  const handleTaskComplete = async (completedTask: AnnotationTask) => {
    try {
      if (!spreadsheetId) {
        toast({ title: "Missing config", description: "No spreadsheet configured", variant: "destructive" })
        return
      }

      const duration =
        completedTask.startTime && completedTask.endTime
          ? Math.round((completedTask.endTime.getTime() - completedTask.startTime.getTime()) / (1000 * 60))
          : 0

      const lang = (completedTask.csvRow.data[4] || "").trim().toLowerCase()
      const isEN = lang === "en"
      const targetLang = (completedTask.translation ? (completedTask as any).translationLanguage : undefined) as
        | "ha"
        | "yo"
        | undefined

      // Map language-specific fields
      const claim_text_ha = isEN
        ? targetLang === "ha"
          ? completedTask.translationHausa || completedTask.claims.join(" | ")
          : completedTask.translationHausa || undefined
        : undefined

      const claim_text_yo = isEN
        ? targetLang === "yo"
          ? completedTask.translationYoruba || completedTask.claims.join(" | ")
          : completedTask.translationYoruba || undefined
        : undefined

      const article_body_ha = isEN
        ? targetLang === "ha"
          ? completedTask.articleBodyHausa || completedTask.articleBody || ""
          : completedTask.articleBodyHausa || undefined
        : undefined

      const article_body_yo = isEN
        ? targetLang === "yo"
          ? completedTask.articleBodyYoruba || completedTask.articleBody || ""
          : completedTask.articleBodyYoruba || undefined
        : undefined

      const annotation = {
        rowId: completedTask.rowId,
        annotatorId: libUser.id,
        claimText: completedTask.claims.join(" | "),
        sourceLinks: completedTask.sourceLinks,
        translation: completedTask.translation,
        verdict: completedTask.verdict,
        sourceUrl: (completedTask as any).sourceUrl || completedTask.sourceLinks[0] || "",
        claimLinks: (completedTask as any).claimLinks ?? (completedTask.sourceLinks || []).slice(1),
        claim_text_ha,
        claim_text_yo,
        article_body_ha,
        article_body_yo,
        translationLanguage: targetLang,
        startTime: completedTask.startTime?.toISOString() || "",
        endTime: completedTask.endTime?.toISOString() || "",
        durationMinutes: duration,
        status: "completed" as const,
      }

      await createAnnotation({ spreadsheetId, annotation })
      toast({ title: "Task saved", description: "Annotation saved successfully" })
      router.push(`${targetAfterComplete}?refresh=1`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: "Save failed", description: message, variant: "destructive" })
    }
  }

  const handleTaskCancel = () => {
    router.push(`${targetAfterComplete}?refresh=1`)
  }

  if (loading) return <div className="container mx-auto p-6">Loading task…</div>
  if (!task) return null

  return (
    <div className="min-h-screen bg-background">
      <AnnotationForm task={task} user={libUser} onComplete={handleTaskComplete} onCancel={handleTaskCancel} />
    </div>
  )
}
