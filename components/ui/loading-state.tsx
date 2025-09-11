import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"
import { LoadingDots } from "./loading-dots"
import { SkeletonLoader } from "./skeleton-loader"

interface LoadingStateProps {
  type?: "spinner" | "dots" | "skeleton"
  size?: "sm" | "md" | "lg"
  message?: string
  className?: string
  lines?: number
  avatar?: boolean
}

export function LoadingState({
  type = "spinner",
  size = "md",
  message,
  className,
  lines = 3,
  avatar = false,
}: LoadingStateProps) {
  const renderLoader = () => {
    switch (type) {
      case "dots":
        return <LoadingDots size={size} />
      case "skeleton":
        return <SkeletonLoader lines={lines} avatar={avatar} />
      default:
        return <LoadingSpinner size={size} />
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      {renderLoader()}
      {message && <p className="mt-3 text-sm text-muted-foreground text-center">{message}</p>}
    </div>
  )
}
