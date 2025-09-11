import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface FormSkeletonProps {
  fields?: number
  showTitle?: boolean
  showButtons?: boolean
  className?: string
}

export function FormSkeleton({ fields = 4, showTitle = true, showButtons = true, className }: FormSkeletonProps) {
  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        {showButtons && (
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
