"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnnotationForm } from "@/components/annotation-form"
import type { AnnotationTask } from "@/lib/data-store"
import type { User as LibUser } from "@/lib/auth"
import { useAuth } from "@/custom-hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { useCreateRegularAnnotation, useCreateTranslationAnnotation } from "@/custom-hooks/useAnnotations"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { TaskService } from "@/lib/task-service"
import { AnnotationMapper } from "@/lib/annotation-mapper"

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
  const [error, setError] = useState<string | null>(null)
  const { handleError } = useErrorHandler()
  const { create: createRegular } = useCreateRegularAnnotation()
  const { create: createTranslation } = useCreateTranslationAnnotation()

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
        setError(null)
        if (!csvFileId) {
          throw new Error("CSV file not configured")
        }

        const newTask = await TaskService.createTaskFromCSV(csvFileId, rowId)

        if (!cancelled) setTask(newTask)
      } catch (e) {
        if (!cancelled) {
          const errorMessage = handleError(e, { context: "loadTask", rowId })
          setError("Could not load the selected task. Please try again or contact support.")

          setTimeout(() => {
            if (!cancelled) {
              router.push(targetAfterComplete)
            }
          }, 3000)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [rowId, router, targetAfterComplete, csvFileId, handleError])

  const handleTaskComplete = async (completedTask: AnnotationTask) => {
    try {
      if (!spreadsheetId) {
        throw new Error("No spreadsheet configured")
      }

      const annotation = AnnotationMapper.taskToAnnotation(completedTask, libUser.id)

      const submissionType = TaskService.determineSubmissionType(completedTask)

      if (submissionType === "translation") {
        await createTranslation({ spreadsheetId, annotation })
      } else {
        await createRegular({ spreadsheetId, annotation })
      }

      toast({ title: "Task saved", description: "Annotation saved successfully" })
      router.push(`${targetAfterComplete}?refresh=1`)
    } catch (error) {
      handleError(error, { context: "saveTask", taskId: completedTask.id })
    }
  }

  const handleTaskCancel = () => {
    router.push(`${targetAfterComplete}?refresh=1`)
  }

  if (!user) return null
  const libUser = user as unknown as LibUser

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState type="spinner" message="Loading annotation task..." className="min-h-screen" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorState
          title="Failed to Load Task"
          message={error}
          onRetry={() => window.location.reload()}
          onGoBack={() => router.push(targetAfterComplete)}
        />
      </div>
    )
  }

  if (!task) return null

  return (
    <div className="min-h-screen bg-background">
      <AnnotationForm task={task} user={libUser} onComplete={handleTaskComplete} onCancel={handleTaskCancel} />
    </div>
  )
}
