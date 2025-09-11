import { cn } from "@/lib/utils"

interface LoadingDotsProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingDots({ className, size = "md" }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  }

  return (
    <div className={cn("flex items-center space-x-1", className)} role="status" aria-label="Loading">
      <div className={cn("loading-dot rounded-full bg-primary", sizeClasses[size])} />
      <div className={cn("loading-dot rounded-full bg-primary", sizeClasses[size])} />
      <div className={cn("loading-dot rounded-full bg-primary", sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
