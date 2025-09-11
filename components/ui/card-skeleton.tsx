import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface CardSkeletonProps {
  showHeader?: boolean
  showDescription?: boolean
  contentLines?: number
  className?: string
}

export function CardSkeleton({
  showHeader = true,
  showDescription = true,
  contentLines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          {showDescription && (
            <CardDescription>
              <Skeleton className="h-4 w-full" />
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === contentLines - 1 ? "w-3/4" : "w-full")} />
        ))}
      </CardContent>
    </Card>
  )
}
