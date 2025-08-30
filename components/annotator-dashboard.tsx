"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Clock, FileText, CheckCircle, Play, DollarSign } from "lucide-react"
import { AnnotationForm } from "@/components/annotation-form"
import { PaymentDashboard } from "@/components/payment-dashboard"
import { LogoutButton } from "@/components/logout-button"
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
  const { toast } = useToast()

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
      toast({
        title: "Error Loading Stats",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      })
    }
  }

  const startNewTask = async () => {
    setIsLoading(true)
    try {
      const csvFileId = getCSVFileId()
      if (!csvFileId) {
        toast({
          title: "Configuration Missing",
          description: "No CSV file configured. Please contact admin.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/drive/csv/${csvFileId}`)
      if (!response.ok) throw new Error("Failed to load CSV data")

      const { data } = await response.json()

      const nextRowIndex = Math.floor(Math.random() * (data.length - 1)) + 1 // Skip header
      const rowData = data[nextRowIndex]

      if (!rowData || rowData.length === 0) {
        toast({
          title: "No Tasks Available",
          description: "All annotation tasks have been completed.",
          variant: "default",
        })
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
      toast({
        title: "Task Start Failed",
        description: "Failed to start new annotation task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskComplete = async (completedTask: AnnotationTask) => {
    try {
      const spreadsheetId = getSpreadsheetId()
      if (!spreadsheetId) {
        toast({
          title: "Configuration Missing",
          description: "No spreadsheet configured. Please contact admin.",
          variant: "destructive",
        })
        return
      }

      const duration =
        completedTask.startTime && completedTask.endTime
          ? Math.round((completedTask.endTime.getTime() - completedTask.startTime.getTime()) / (1000 * 60))
          : 0

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

      setCurrentTask(null)
      setCurrentTaskState(null)
      loadStats()

      toast({
        title: "Task Completed",
        description: "Your annotation has been saved successfully!",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save annotation. Please try again.",
        variant: "destructive",
      })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Annotator Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400">Welcome back, {user.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton />
            <Avatar className="ring-2 ring-slate-200 dark:ring-slate-700">
              <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.completedToday}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">rows annotated</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Worked</CardTitle>
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.timeWorkedToday}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">today</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending Tasks</CardTitle>
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pendingTasks || "-"}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">rows remaining</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="annotation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="annotation" className="gap-2">
              <Play className="h-4 w-4" />
              Annotation
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="annotation">
            <Card className="shadow-sm border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                <CardTitle className="text-slate-900 dark:text-slate-100">Ready to Start Annotating?</CardTitle>
                <CardDescription>
                  Click below to begin your next annotation task. The system will automatically track your time and
                  progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Button
                  size="lg"
                  className="w-full md:w-auto h-12 gap-2 bg-primary hover:bg-primary/90"
                  onClick={startNewTask}
                  disabled={isLoading}
                >
                  <Play className="h-4 w-4" />
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
    </div>
  )
}
