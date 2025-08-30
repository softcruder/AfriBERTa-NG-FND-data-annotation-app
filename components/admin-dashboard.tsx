"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, DollarSign, Download, Settings, Activity } from "lucide-react"
import { AnnotatorManagement } from "@/components/annotator-management"
import { formatMoney } from "@/lib/utils"
import { DataConfiguration } from "@/components/data-configuration"
import { AnnotationMonitoring } from "@/components/annotation-monitoring"
import { PaymentOverview } from "@/components/payment-overview"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/hooks/use-toast"
import { useConfig, useAnnotations } from "@/custom-hooks"

interface AdminDashboardProps {
  user: User
}

interface AdminStats {
  activeAnnotators: number
  totalAnnotations: number
  pendingPayments: number
  completionRate: number
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    activeAnnotators: 0,
    totalAnnotations: 0,
    pendingPayments: 0,
    completionRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const { spreadsheetId } = useConfig()
  const { data: annotations } = useAnnotations(spreadsheetId)

  useEffect(() => {
    // Derive stats from annotations and payments
    if (!annotations) return
    const today = new Date().toDateString()
    const activeToday = new Set(
      annotations.filter((a: any) => new Date(a.startTime).toDateString() === today).map((a: any) => a.annotatorId),
    ).size

    const completed = annotations.filter((a: any) => a.status === "completed").length
    const total = annotations.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    setStats(prev => ({
      ...prev,
      activeAnnotators: activeToday,
      totalAnnotations: total,
      // pendingPayments filled from PaymentOverview or separate hook if needed
      completionRate,
    }))
    setIsLoading(false)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage annotators and monitor progress</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <LogoutButton />
          <Avatar>
            <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Annotators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.activeAnnotators}</div>
            <p className="text-xs text-muted-foreground">working today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalAnnotations}</div>
            <p className="text-xs text-muted-foreground">completed rows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : formatMoney("₦", stats.pendingPayments)}</div>
            <p className="text-xs text-muted-foreground">total due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.completionRate}%</div>
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
          <AnnotationMonitoring onStatsUpdate={setStats} />
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
