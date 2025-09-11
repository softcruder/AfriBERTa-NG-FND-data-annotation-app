"use client"

import { AlertTriangle, X, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: "default" | "destructive"
}

export function ErrorAlert({
  title = "Error",
  message,
  onRetry,
  onDismiss,
  className,
  variant = "destructive",
}: ErrorAlertProps) {
  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertTriangle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription>
          <div className="font-medium">{title}</div>
          <div className="text-sm mt-1">{message}</div>
        </AlertDescription>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
