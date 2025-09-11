import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Available Tasks</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-sm text-muted-foreground">Loading…</div>
            <Button variant="outline" size="sm" disabled>
              Refresh
            </Button>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
