"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { TaskService } from "@/lib/task-service"
import { AnnotationMapper } from "@/lib/annotation-mapper"
import type { AnnotationTask } from "@/lib/data-store"

interface UseTaskManagementProps {
  csvFileId?: string
  spreadsheetId?: string
  annotatorId: string
  onTaskComplete?: () => void
}

export function useTaskManagement({ csvFileId, spreadsheetId, annotatorId, onTaskComplete }: UseTaskManagementProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { handleError } = useErrorHandler()

  const startTask = useCallback(
    async (rowId: string): Promise<AnnotationTask | null> => {
      if (!csvFileId) {
        toast({
          title: "Configuration Missing",
          description: "No CSV file configured. Please contact admin.",
          variant: "destructive",
        })
        return null
      }

      setLoading(true)
      try {
        const task = await TaskService.createTaskFromCSV(csvFileId, rowId)
        return task
      } catch (error) {
        handleError(error, { context: "startTask", rowId })
        return null
      } finally {
        setLoading(false)
      }
    },
    [csvFileId, toast, handleError],
  )

  const completeTask = useCallback(
    async (task: AnnotationTask, createAnnotation: (data: any) => Promise<void>) => {
      if (!spreadsheetId) {
        toast({
          title: "Configuration Missing",
          description: "No spreadsheet configured. Please contact admin.",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      try {
        const annotation = AnnotationMapper.taskToAnnotation(task, annotatorId)
        await createAnnotation({ spreadsheetId, annotation })

        toast({
          title: "Task Completed",
          description: "Your annotation has been saved successfully!",
        })

        onTaskComplete?.()
      } catch (error) {
        handleError(error, { context: "completeTask", taskId: task.id })
      } finally {
        setLoading(false)
      }
    },
    [spreadsheetId, annotatorId, toast, handleError, onTaskComplete],
  )

  const navigateToTask = useCallback(
    (rowId: string, role: "admin" | "annotator" = "annotator") => {
      router.push(`/dashboard/${role}/annotate/${encodeURIComponent(rowId)}`)
    },
    [router],
  )

  return {
    loading,
    startTask,
    completeTask,
    navigateToTask,
  }
}
