import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value?: number
  max?: number
  className?: string
  showValue?: boolean
  indeterminate?: boolean
}

export function ProgressBar({
  value = 0,
  max = 100,
  className,
  showValue = false,
  indeterminate = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1">
        {showValue && <span className="text-sm font-medium text-foreground">{Math.round(percentage)}%</span>}
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        {indeterminate ? (
          <div className="h-full bg-primary rounded-full progress-bar" />
        ) : (
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  )
}
