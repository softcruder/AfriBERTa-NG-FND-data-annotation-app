"use client"

import { useState, useEffect } from "react"
import { useConfig, useAnnotations, useVerifyAnnotation } from "@/custom-hooks"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface AnnotationMonitoringProps {
  onStatsUpdate?: (stats: any) => void
}

interface AnnotationActivity {
  id: string
  annotatorId: string
  annotatorName: string
  annotatorEmail: string
  rowId: string
  claimText: string
  status: "in-progress" | "completed" | "verified"
  startTime: string
  endTime?: string
  durationMinutes?: number
}

export function AnnotationMonitoring({ onStatsUpdate }: AnnotationMonitoringProps) {
  const { spreadsheetId } = useConfig()
  const { verify } = useVerifyAnnotation()
  const [activities, setActivities] = useState<AnnotationActivity[]>([])
  const { data: annotations, isLoading, mutate } = useAnnotations(spreadsheetId)

  useEffect(() => {
    if (!annotations) return
    const activitiesData: AnnotationActivity[] = annotations.map((annotation: any) => ({
      id: `${annotation.rowId}_${annotation.startTime}`,
      annotatorId: annotation.annotatorId,
      annotatorName: annotation.annotatorName || `User ${annotation.annotatorId.slice(-4)}`,
      annotatorEmail: annotation.annotatorEmail || annotation.annotatorId,
      rowId: annotation.rowId,
      claimText: annotation.claimText.substring(0, 100) + (annotation.claimText.length > 100 ? "..." : ""),
      status: annotation.status,
      startTime: annotation.startTime,
      endTime: annotation.endTime,
      durationMinutes: annotation.durationMinutes,
    }))
    activitiesData.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    setActivities(activitiesData)

    if (onStatsUpdate) {
      const today = new Date().toDateString()
      const activeToday = new Set(
        activitiesData.filter(a => new Date(a.startTime).toDateString() === today).map(a => a.annotatorId),
      ).size
      onStatsUpdate({
        activeAnnotators: activeToday,
        totalAnnotations: activitiesData.filter(a => a.status === "completed").length,
        pendingPayments: 0,
        completionRate: 0,
      })
    }
  }, [annotations, onStatsUpdate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-orange-500" />
      case "verified":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800">
            Completed
          </Badge>
        )
      case "verified":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Verified
          </Badge>
        )
      case "in-progress":
        return <Badge variant="secondary">In Progress</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatTime = (timeString: string) => formatDate(timeString, { withTime: true })

  return (
    <div className="space-y-6">
      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live feed of annotation activities</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activities found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Annotator</TableHead>
                  <TableHead>Row ID</TableHead>
                  <TableHead>Claim Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 20).map(activity => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {activity.annotatorName
                              .split(" ")
                              .map(n => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{activity.annotatorName}</div>
                          <div className="text-xs text-muted-foreground">{activity.annotatorEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{activity.rowId}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">{activity.claimText}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(activity.status)}
                        {getStatusBadge(activity.status)}
                        {activity.status !== "verified" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                if (!spreadsheetId) return
                                const res = await verify({ spreadsheetId, rowId: activity.rowId })
                                if (res?.success) {
                                  setActivities(prev =>
                                    prev.map(a => (a.id === activity.id ? { ...a, status: "verified" } : a)),
                                  )
                                }
                              } catch {}
                            }}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(activity.durationMinutes)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(activity.startTime, { withTime: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a =>
                        a.status === "completed" && new Date(a.startTime).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a =>
                        a.status === "in-progress" &&
                        new Date(a.startTime).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a =>
                        a.status === "verified" && new Date(a.startTime).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Per Row</span>
                <span className="font-medium">
                  {formatDuration(
                    activities.filter(a => a.durationMinutes).reduce((sum, a) => sum + (a.durationMinutes || 0), 0) /
                      Math.max(1, activities.filter(a => a.durationMinutes).length),
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="font-medium">
                  {formatDuration(
                    activities
                      .filter(
                        a => a.durationMinutes && new Date(a.startTime).toDateString() === new Date().toDateString(),
                      )
                      .reduce((sum, a) => sum + (a.durationMinutes || 0), 0) /
                      Math.max(
                        1,
                        activities.filter(
                          a => a.durationMinutes && new Date(a.startTime).toDateString() === new Date().toDateString(),
                        ).length,
                      ),
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verification Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round((activities.filter(a => a.status === "verified").length / activities.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round(
                        (activities.filter(a => a.status === "completed" || a.status === "verified").length /
                          activities.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
