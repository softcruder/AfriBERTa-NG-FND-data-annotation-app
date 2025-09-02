"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth, useAnnotations, useVerifyAnnotation, useAdminVerify } from "@/custom-hooks"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, CheckCircle, AlertCircle, RefreshCw, ThumbsUp, ThumbsDown, Ban } from "lucide-react"

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
  status: "in-progress" | "completed" | "verified" | "qa-review" | "needs-revision" | "approved" | "invalid"
  startTime: string
  endTime?: string
  durationMinutes?: number
  isValid?: boolean
  invalidityReason?: string
  qaComments?: string
  adminComments?: string
}

export function AnnotationMonitoring({ onStatsUpdate }: AnnotationMonitoringProps) {
  const { spreadsheetId, user } = useAuth()
  const { verify } = useVerifyAnnotation()
  const { adminVerify } = useAdminVerify()
  const { data: annotations, isLoading, mutate } = useAnnotations(spreadsheetId)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string>("")
  const [adminComments, setAdminComments] = useState("")
  const [invalidityReason, setInvalidityReason] = useState("")
  const activities: AnnotationActivity[] = useMemo(() => {
    if (!Array.isArray(annotations)) return []
    const items = annotations.map((annotation: any) => ({
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
      isValid: annotation.isValid,
      invalidityReason: annotation.invalidityReason,
      qaComments: annotation.qaComments,
      adminComments: annotation.adminComments,
    })) as AnnotationActivity[]
    return items.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [annotations])

  // Emit stats only when activities change to avoid loops
  useEffect(() => {
    if (!onStatsUpdate || activities.length === 0) return
    const today = new Date().toDateString()
    const activeToday = new Set(
      activities.filter(a => new Date(a.startTime).toDateString() === today).map(a => a.annotatorId),
    ).size
    onStatsUpdate({
      activeAnnotators: activeToday,
      totalAnnotations: activities.filter(a => a.status === "completed").length,
      pendingPayments: 0,
      completionRate: 0,
    })
  }, [activities, onStatsUpdate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-orange-500" />
      case "verified":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "qa-review":
        return <AlertCircle className="h-4 w-4 text-purple-500" />
      case "needs-revision":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
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
      case "qa-review":
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            QA Review
          </Badge>
        )
      case "needs-revision":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Needs Revision
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        )
      case "invalid":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Invalid
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

  const handleAdminAction = async (action: "approve" | "needs-revision" | "mark-invalid") => {
    try {
      if (!spreadsheetId || !selectedRowId) return

      await adminVerify({
        spreadsheetId,
        rowId: selectedRowId,
        action,
        comments: adminComments,
        invalidityReason: action === "mark-invalid" ? invalidityReason : undefined,
      })

      mutate()
      setAdminDialogOpen(false)
      setAdminComments("")
      setInvalidityReason("")
      setSelectedRowId("")
    } catch (error) {
      console.error("Admin action failed:", error)
    }
  }

  const openAdminDialog = (rowId: string) => {
    setSelectedRowId(rowId)
    setAdminDialogOpen(true)
  }

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
            <Button variant="outline" size="sm" onClick={() => mutate()} isLoading={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
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
                  <TableHead>Actions</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(activity.durationMinutes)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(activity.startTime, { withTime: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* QA Verify Button */}
                        {(user?.role as any) === "qa" && activity.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                if (!spreadsheetId) return
                                const res = await verify({ spreadsheetId, rowId: activity.rowId })
                                if (res?.success) {
                                  mutate()
                                }
                              } catch {}
                            }}
                          >
                            QA Review
                          </Button>
                        )}

                        {/* Admin Actions */}
                        {user?.role === "admin" &&
                          (activity.status === "verified" || activity.status === "qa-review") && (
                            <Button variant="outline" size="sm" onClick={() => openAdminDialog(activity.rowId)}>
                              Admin Review
                            </Button>
                          )}
                      </div>
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
                <span className="text-sm text-muted-foreground">QA Review</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a =>
                        (a.status === "verified" || a.status === "qa-review") &&
                        new Date(a.startTime).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a =>
                        a.status === "approved" && new Date(a.startTime).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invalid</span>
                <span className="font-medium">
                  {
                    activities.filter(
                      a => a.status === "invalid" && new Date(a.startTime).toDateString() === new Date().toDateString(),
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
                <span className="text-sm text-muted-foreground">QA Review Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round(
                        (activities.filter(a => a.status === "verified" || a.status === "qa-review").length /
                          activities.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approval Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round((activities.filter(a => a.status === "approved").length / activities.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invalid Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round((activities.filter(a => a.status === "invalid").length / activities.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="font-medium">
                  {activities.length > 0
                    ? Math.round(
                        (activities.filter(
                          a =>
                            a.status === "completed" ||
                            a.status === "verified" ||
                            a.status === "qa-review" ||
                            a.status === "approved",
                        ).length /
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

      {/* Admin Review Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Review</DialogTitle>
            <DialogDescription>Review and take action on this annotation (Row ID: {selectedRowId})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-comments">Admin Comments</Label>
              <Textarea
                id="admin-comments"
                value={adminComments}
                onChange={e => setAdminComments(e.target.value)}
                placeholder="Enter comments for this review..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="invalidity-reason">Invalidity Reason (if marking invalid)</Label>
              <Textarea
                id="invalidity-reason"
                value={invalidityReason}
                onChange={e => setInvalidityReason(e.target.value)}
                placeholder="Explain why this annotation is invalid..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleAdminAction("approve")}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAdminAction("needs-revision")}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Needs Revision
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAdminAction("mark-invalid")}
                className="flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                Mark Invalid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
