"use client"

import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { AppErrorHandler } from "@/lib/error-handler"

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, context?: Record<string, any>) => {
      AppErrorHandler.logError(error, context)
      const message = AppErrorHandler.getErrorMessage(error)

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    },
    [toast],
  )

  const handleAsyncError = useCallback(
    async (asyncFn: () => Promise<void>, context?: Record<string, any>) => {
      try {
        await asyncFn()
      } catch (error) {
        handleError(error, context)
      }
    },
    [handleError],
  )

  return {
    handleError,
    handleAsyncError,
    getErrorMessage: AppErrorHandler.getErrorMessage,
  }
}
