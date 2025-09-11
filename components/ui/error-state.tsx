"use client"

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  onGoBack?: () => void
  className?: string
  showIcon?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this content. Please try again.",
  onRetry,
  onGoBack,
  className,
  showIcon = true,
}: ErrorStateProps) {
  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        )}
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack} className="flex-1 bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
