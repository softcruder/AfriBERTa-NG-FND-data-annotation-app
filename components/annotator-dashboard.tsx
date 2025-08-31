"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Clock, FileText, CheckCircle, Play, DollarSign, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react"
import { AnnotationForm } from "@/components/annotation-form"
import { PaymentDashboard } from "@/components/payment-dashboard"
// import { LogoutButton } from "@/components/logout-button"
import { getCurrentTask, setCurrentTask } from "@/lib/data-store"
import type { AnnotationTask } from "@/lib/data-store"
import { useAuth, useTasks, useAnnotations, useAnonymizeSelf } from "@/custom-hooks"
import { useCreateAnnotation } from "@/custom-hooks/useAnnotations"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"

interface AnnotatorDashboardProps {
  user: User
}

export function AnnotatorDashboard({ user }: AnnotatorDashboardProps) {
  const router = useRouter()
  const [currentTask, setCurrentTaskState] = useState<AnnotationTask | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tasksPage, setTasksPage] = useState(1)
  const pageSize = 10
  const { toast } = useToast()
  const { spreadsheetId, csvFileId } = useAuth()
  const { data: tasksResp } = useTasks({ page: tasksPage, pageSize, fileId: csvFileId || undefined })
  const { data: annotations, mutate: mutateAnnotations } = useAnnotations(spreadsheetId)
  const { anonymize, loading: anonymizing } = useAnonymizeSelf()
  const { create: createAnnotation } = useCreateAnnotation()
  const { verify: verifyAnnotation } = useVerifyAnnotation()

  useEffect(() => {
    const task = getCurrentTask()
    setCurrentTaskState(task)
  }, [])

  // Derive tasks and totals directly from hook data (no local mirrors)
  const tasks = tasksResp?.items ?? []
  const tasksTotal = tasksResp?.total ?? 0

  // Derive QA items from annotations
  const qaItems = useMemo(() => {
    if (!Array.isArray(annotations)) return []
    const unverified = annotations.filter((a: any) => !a.verifiedBy && a.status !== "verified")
    return unverified.slice(0, 10)
  }, [annotations])

  // Derive stats
  const { completedToday, timeWorkedToday, pendingTasks } = useMemo(() => {
    if (!annotations) return { completedToday: 0, timeWorkedToday: "0h 0m", pendingTasks: 0 }
    const today = new Date().toDateString()
    const todayAnnotations = annotations.filter(
      (a: any) =>
        a.annotatorId === user.id && new Date(a.startTime).toDateString() === today && a.status === "completed",
    )
    const totalMinutesToday = todayAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)
    const hours = Math.floor(totalMinutesToday / 60)
    const minutes = totalMinutesToday % 60
    return { completedToday: todayAnnotations.length, timeWorkedToday: `${hours}h ${minutes}m`, pendingTasks: 0 }
  }, [annotations, user.id])

  const startTaskFromRow = async (row: { index: number; data: string[]; header: string[] }) => {
    setIsLoading(true)
    console.log("Starting task from row:", row)
    try {
      if (!csvFileId) {
        toast({
          title: "Configuration Missing",
          description: "No CSV file configured. Please contact admin.",
          variant: "destructive",
        })
        return
      }
      // Navigate to dedicated annotate page using CSV ID (first column)
      const idCol = (row.data?.[0] || "").trim()
      if (!idCol) {
        toast({ title: "Missing ID", description: "This row has no ID in column A.", variant: "destructive" })
        return
      }
      const rowId = idCol
      router.push(`/dashboard/annotator/annotate/${encodeURIComponent(rowId)}`)
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

  const handleAnonymize = async () => {
    try {
      const res = await anonymize()
      if ((res as any)?.success) {
        toast({ title: "Data anonymized", description: "Your annotations are now anonymized." })
      }
    } catch {
      toast({ title: "Failed", description: "Could not anonymize data.", variant: "destructive" })
    }
  }

  const handleTaskComplete = async (completedTask: AnnotationTask) => {
    try {
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

      const lang = (completedTask.csvRow.data[4] || "").trim().toLowerCase()
      const isEN = lang === "en"
      const targetLang = (completedTask.translation ? (completedTask as any).translationLanguage : undefined) as
        | "ha"
        | "yo"
        | undefined

      const annotation = {
        rowId: completedTask.rowId,
        annotatorId: user.id,
        claimText: completedTask.claims.join(" | "),
        sourceLinks: completedTask.sourceLinks,
        translation: completedTask.translation,
        verdict: completedTask.verdict,
        sourceUrl: (completedTask as any).sourceUrl || completedTask.sourceLinks[0] || "",
        claimLinks: (completedTask as any).claimLinks ?? (completedTask.sourceLinks || []).slice(1),
        claim_text_ha: isEN && targetLang === "ha" ? completedTask.claims.join(" | ") : undefined,
        claim_text_yo: isEN && targetLang === "yo" ? completedTask.claims.join(" | ") : undefined,
        article_body_ha: isEN && targetLang === "ha" ? completedTask.articleBody || "" : undefined,
        article_body_yo: isEN && targetLang === "yo" ? completedTask.articleBody || "" : undefined,
        translationLanguage: targetLang,
        startTime: completedTask.startTime?.toISOString() || "",
        endTime: completedTask.endTime?.toISOString() || "",
        durationMinutes: duration,
        status: "completed" as const,
      }

      await createAnnotation({ spreadsheetId, annotation })

      setCurrentTask(null)
      setCurrentTaskState(null)
      // refresh annotations to update stats and QA lists
      mutateAnnotations()

      toast({
        title: "Task Completed",
        description: "Your annotation has been saved successfully!",
        variant: "success",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast({
        title: "Save Failed",
        description: message,
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Removed page-level header to avoid duplicate headers on dashboard */}

        {/* Stats Cards: stack on mobile, grid on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{completedToday}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">rows annotated</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Worked</CardTitle>
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{timeWorkedToday}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">today</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Pending Tasks</CardTitle>
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingTasks || "-"}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">rows remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: full width, readable on mobile */}
        <Tabs defaultValue="annotation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="annotation" className="gap-2 text-xs md:text-base py-2 md:py-3">
              <Play className="h-4 w-4" />
              Annotation
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 text-xs md:text-base py-2 md:py-3">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="annotation">
            <Card className="shadow-sm border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                <CardTitle className="text-slate-900 dark:text-slate-100 text-lg md:text-xl">
                  Ready to Start Annotating?
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Click below to begin your next annotation task. The system will automatically track your time and
                  progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <Button
                  size="lg"
                  className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-base md:text-lg"
                  onClick={() => tasks[0] && startTaskFromRow(tasks[0])}
                  disabled={isLoading}
                >
                  <Play className="h-4 w-4" />
                  {isLoading ? "Loading Task..." : "Start First Task on Page"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <PaymentDashboard user={user} />
          </TabsContent>
        </Tabs>

        {/* Task list with pagination */}
        <div className="mt-8" id="qa-section">
          <Card className="shadow-sm border-slate-200 dark:border-slate-700">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-lg">Available Tasks</CardTitle>
              <CardDescription>
                Showing {tasks.length} of {tasksTotal} rows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {tasks.map(t => (
                  <div
                    key={t.index}
                    className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground">ID: {(t.data?.[0] || "").trim() || "(none)"}</div>
                      <div className="font-medium truncate">{t.data[1] || t.data[0] || "(empty)"}</div>
                    </div>
                    <Button size="sm" onClick={() => startTaskFromRow(t)} className="gap-2 w-full sm:w-auto">
                      <Play className="h-4 w-4" /> Start
                    </Button>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks to show.</div>}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTasksPage(p => Math.max(1, p - 1))}
                  disabled={tasksPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <div className="text-sm">
                  Page {tasksPage} of {Math.max(1, Math.ceil(tasksTotal / pageSize))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTasksPage(p => p + 1)}
                  disabled={tasksPage >= Math.ceil(tasksTotal / pageSize)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Minimal QA section */}
        <div className="mt-8">
          <Card className="shadow-sm border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Quality Assurance
              </CardTitle>
              <CardDescription>Verify recently completed annotations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {qaItems.map(item => (
                <div key={item.rowId} className="p-3 border rounded-lg flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground truncate">{item.claimText}</div>
                    <div className="text-xs text-muted-foreground">
                      By: {item.annotatorId} · Status: {item.status}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!spreadsheetId) return
                        const res = await verifyAnnotation({ spreadsheetId: spreadsheetId!, rowId: item.rowId })
                        if ((res as any)?.success !== false) {
                          await mutateAnnotations()
                          toast({ title: "Verified", description: "Annotation marked as verified." })
                        }
                      } catch {}
                    }}
                  >
                    Mark Verified
                  </Button>
                </div>
              ))}
              {qaItems.length === 0 && (
                <div className="text-sm text-muted-foreground">No items pending verification.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
