import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  avatar?: boolean
}

export function SkeletonLoader({ className, lines = 3, avatar = false }: SkeletonLoaderProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-muted h-10 w-10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn("h-4 bg-muted rounded", i === lines - 1 ? "w-3/4" : "w-full")} />
        ))}
      </div>
    </div>
  )
}
