"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileText, CheckCircle, Play, DollarSign } from "lucide-react"
import { AnnotationForm } from "@/components/annotation-form"
import { PaymentDashboard } from "@/components/payment-dashboard"
import { getCurrentTask, setCurrentTask, getSpreadsheetId, getCSVFileId } from "@/lib/data-store"
import type { AnnotationTask } from "@/lib/data-store"

interface AnnotatorDashboardProps {
  user: User
}

interface DashboardStats {
  completedToday: number
  timeWorkedToday: string
  pendingTasks: number
}

export function AnnotatorDashboard({ user }: AnnotatorDashboardProps) {
  const [currentTask, setCurrentTaskState] = useState<AnnotationTask | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    completedToday: 0,
    timeWorkedToday: "0h 0m",
    pendingTasks: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load current task and stats on mount
  useEffect(() => {
    const task = getCurrentTask()
    setCurrentTaskState(task)
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const spreadsheetId = getSpreadsheetId()
      if (!spreadsheetId) return

      const response = await fetch(`/api/annotations?spreadsheetId=${spreadsheetId}`)
      if (!response.ok) return

      const { annotations } = await response.json()

      // Calculate today's stats
      const today = new Date().toDateString()
      const todayAnnotations = annotations.filter(
        (a: any) =>
          a.annotatorId === user.id && new Date(a.startTime).toDateString() === today && a.status === "completed",
      )

      const totalMinutesToday = todayAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)

      const hours = Math.floor(totalMinutesToday / 60)
      const minutes = totalMinutesToday % 60

      setStats({
        completedToday: todayAnnotations.length,
        timeWorkedToday: `${hours}h ${minutes}m`,
        pendingTasks: 0, // TODO: Calculate from CSV data
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const startNewTask = async () => {
    setIsLoading(true)
    try {
      const csvFileId = getCSVFileId()
      if (!csvFileId) {
        alert("No CSV file configured. Please contact admin.")
        return
      }

      // Get CSV data
      const response = await fetch(`/api/drive/csv/${csvFileId}`)
      if (!response.ok) throw new Error("Failed to load CSV data")

      const { data } = await response.json()

      // Find next unassigned row (simplified logic)
      // TODO: Implement proper assignment tracking
      const nextRowIndex = Math.floor(Math.random() * (data.length - 1)) + 1 // Skip header
      const rowData = data[nextRowIndex]

      if (!rowData || rowData.length === 0) {
        alert("No more tasks available")
        return
      }

      const newTask: AnnotationTask = {
        id: `task_${Date.now()}`,
        rowId: `${csvFileId}_row_${nextRowIndex}`,
        csvRow: {
          id: `${csvFileId}_row_${nextRowIndex}`,
          originalIndex: nextRowIndex,
          data: rowData,
        },
        startTime: new Date(),
        claims: [rowData[0] || ""], // Assume first column is claim text
        sourceLinks: [rowData[1] || ""], // Assume second column is source link
        status: "in-progress",
      }

      setCurrentTask(newTask)
      setCurrentTaskState(newTask)
    } catch (error) {
      console.error("Error starting new task:", error)
      alert("Failed to start new task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskComplete = async (completedTask: AnnotationTask) => {
    try {
      const spreadsheetId = getSpreadsheetId()
      if (!spreadsheetId) {
        alert("No spreadsheet configured. Please contact admin.")
        return
      }

      // Calculate duration
      const duration =
        completedTask.startTime && completedTask.endTime
          ? Math.round((completedTask.endTime.getTime() - completedTask.startTime.getTime()) / (1000 * 60))
          : 0

      // Log annotation to Google Sheets
      const annotation = {
        rowId: completedTask.rowId,
        annotatorId: user.id,
        claimText: completedTask.claims.join(" | "),
        sourceLinks: completedTask.sourceLinks,
        translation: completedTask.translation,
        startTime: completedTask.startTime?.toISOString() || "",
        endTime: completedTask.endTime?.toISOString() || "",
        durationMinutes: duration,
        status: "completed" as const,
      }

      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, annotation }),
      })

      if (!response.ok) throw new Error("Failed to save annotation")

      // Clear current task and refresh stats
      setCurrentTask(null)
      setCurrentTaskState(null)
      loadStats()

      alert("Task completed successfully!")
    } catch (error) {
      console.error("Error completing task:", error)
      alert("Failed to save annotation")
    }
  }

  const handleTaskCancel = () => {
    setCurrentTask(null)
    setCurrentTaskState(null)
  }

  if (currentTask) {
    return (
      <div className="min-h-screen bg-background">
        <AnnotationForm task={currentTask} user={user} onComplete={handleTaskComplete} onCancel={handleTaskCancel} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Annotator Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">rows annotated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeWorkedToday}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks || "-"}</div>
            <p className="text-xs text-muted-foreground">rows remaining</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="annotation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="annotation">
            <Play className="mr-2 h-4 w-4" />
            Annotation
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annotation">
          <Card>
            <CardHeader>
              <CardTitle>Ready to Start Annotating?</CardTitle>
              <CardDescription>
                Click below to begin your next annotation task. The system will automatically track your time and
                progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full md:w-auto" onClick={startNewTask} disabled={isLoading}>
                <Play className="mr-2 h-4 w-4" />
                {isLoading ? "Loading Task..." : "Start Next Task"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentDashboard user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
