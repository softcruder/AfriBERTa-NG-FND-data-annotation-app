"use client"

import { useMemo } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, DollarSign, Download, Settings, Activity } from "lucide-react"
import { AnnotatorManagement } from "@/components/annotator-management"
import { formatMoney } from "@/lib/utils"
import { DataConfiguration } from "@/components/data-configuration"
import { AnnotationMonitoring } from "@/components/annotation-monitoring"
import { PaymentOverview } from "@/components/payment-overview"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useAnnotations } from "@/custom-hooks"

interface AdminDashboardProps {
  user: User
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const { toast } = useToast()

  const { spreadsheetId } = useAuth()
  const { data: annotations, mutate } = useAnnotations(spreadsheetId)
  const stats = useMemo(() => {
    if (!annotations) {
      return { activeAnnotators: 0, totalAnnotations: 0, pendingPayments: 0, completionRate: 0 }
    }
    const today = new Date().toDateString()
    const activeAnnotators = new Set(
      annotations.filter((a: any) => new Date(a.startTime).toDateString() === today).map((a: any) => a.annotatorId),
    ).size
    const completed = annotations.filter((a: any) => a.status === "completed").length
    const totalAnnotations = annotations.length
    const completionRate = totalAnnotations > 0 ? Math.round((completed / totalAnnotations) * 100) : 0
    return { activeAnnotators, totalAnnotations, pendingPayments: 0, completionRate }
  }, [annotations])

  const handleExportData = async () => {
    try {
      if (!annotations || annotations.length === 0) {
        toast({ description: "No annotation data to export", variant: "destructive" })
        return
      }

      // CSV headers
      const headers = [
        "Row ID",
        "Annotator ID",
        "Claim Text",
        "Source Links",
        "Translation",
        "Start Time",
        "End Time",
        "Duration (min)",
        "Status",
        "Verified By",
      ]

      const csvContent = [
        headers.join(","),
        ...annotations.map((a: any) =>
          [
            a.rowId,
            a.annotatorId,
            `"${(a.claimText || "").replace(/"/g, '""')}"`,
            `"${Array.isArray(a.sourceLinks) ? a.sourceLinks.join("; ") : ""}"`,
            `"${a.translation || ""}"`,
            a.startTime,
            a.endTime || "",
            a.durationMinutes || "",
            a.status,
            a.verifiedBy || "",
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const today = new Date()
      const yyyy = today.getUTCFullYear()
      const mm = String(today.getUTCMonth() + 1).padStart(2, "0")
      const dd = String(today.getUTCDate()).padStart(2, "0")
      a.download = `annotations_export_${yyyy}-${mm}-${dd}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: "Success", description: "Annotation data exported successfully" })
    } catch (error) {
      toast({ description: "Failed to export data. Please try again.", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Removed page-level header to avoid duplicate headers on dashboard; actions are in global header */}
      <div className="flex items-center justify-end mb-6">
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Annotators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAnnotators}</div>
            <p className="text-xs text-muted-foreground">working today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnotations}</div>
            <p className="text-xs text-muted-foreground">completed rows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney("₦", stats.pendingPayments)}</div>
            <p className="text-xs text-muted-foreground">total due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">of dataset</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">
            <Activity className="mr-2 h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="annotators">
            <Users className="mr-2 h-4 w-4" />
            Annotators
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <AnnotationMonitoring onStatsUpdate={mutate} />
        </TabsContent>

        <TabsContent value="annotators">
          <AnnotatorManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentOverview />
        </TabsContent>

        <TabsContent value="configuration">
          <DataConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  )
}
