"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Clock,
  FileText,
  CheckCircle,
  Play,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { PaymentDashboard } from "@/components/payment-dashboard"
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

      // Map language-specific fields
      const claim_text_ha = isEN
        ? targetLang === "ha"
          ? completedTask.translationHausa || completedTask.claims.join(" | ")
          : completedTask.translationHausa || undefined
        : undefined

      const claim_text_yo = isEN
        ? targetLang === "yo"
          ? completedTask.translationYoruba || completedTask.claims.join(" | ")
          : completedTask.translationYoruba || undefined
        : undefined

      const article_body_ha = isEN
        ? targetLang === "ha"
          ? completedTask.articleBodyHausa || completedTask.articleBody || ""
          : completedTask.articleBodyHausa || undefined
        : undefined

      const article_body_yo = isEN
        ? targetLang === "yo"
          ? completedTask.articleBodyYoruba || completedTask.articleBody || ""
          : completedTask.articleBodyYoruba || undefined
        : undefined

      const annotation = {
        rowId: completedTask.rowId,
        annotatorId: user.id,
        claimText: completedTask.claims.join(" | "),
        sourceLinks: completedTask.sourceLinks,
        translation: completedTask.translation,
        verdict: completedTask.verdict,
        sourceUrl: (completedTask as any).sourceUrl || completedTask.sourceLinks[0] || "",
        claimLinks: (completedTask as any).claimLinks ?? (completedTask.sourceLinks || []).slice(1),
        claim_text_ha,
        claim_text_yo,
        article_body_ha,
        article_body_yo,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Annotator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || user.email}. Ready to continue your annotation work?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{completedToday}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                rows annotated
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Time Worked</CardTitle>
              <Clock className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{timeWorkedToday}</div>
              <p className="text-xs text-muted-foreground">today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Tasks</CardTitle>
              <FileText className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tasksTotal || "-"}</div>
              <p className="text-xs text-muted-foreground">rows remaining</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="annotation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
            <TabsTrigger
              value="annotation"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Play className="h-4 w-4" />
              Annotation
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="annotation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Ready to Start Annotating?
                  </CardTitle>
                  <CardDescription>
                    Click below to begin your next annotation task. The system will automatically track your time and
                    progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-base shadow-md"
                    onClick={() => tasks[0] && startTaskFromRow(tasks[0])}
                    disabled={isLoading || !tasks[0]}
                  >
                    {isLoading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {tasks[0] ? "Start Next Task" : "No Tasks Available"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Quality Assurance
                  </CardTitle>
                  <CardDescription>Verify recently completed annotations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {qaItems.slice(0, 3).map((item) => (
                    <div
                      key={item.rowId}
                      className="p-3 border rounded-lg flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.claimText}</div>
                        <div className="text-xs text-muted-foreground">
                          By: {item.annotatorId} · Status: {item.status}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 bg-transparent"
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
                        Verify
                      </Button>
                    </div>
                  ))}
                  {qaItems.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No items pending verification.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
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
                {tasks.map((t) => (
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
                  onClick={() => setTasksPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setTasksPage((p) => p + 1)}
                  disabled={tasksPage >= Math.ceil(tasksTotal / pageSize)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
