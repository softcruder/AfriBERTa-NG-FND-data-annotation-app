"use client"

import type { User } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, DollarSign, Settings, Activity } from "lucide-react"
import { AnnotatorManagement } from "@/components/annotator-management"
import { DataConfiguration } from "@/components/data-configuration"
import { AnnotationMonitoring } from "@/components/annotation-monitoring"
import { PaymentOverview } from "@/components/payment-overview"
import { useAuth } from "@/custom-hooks"

interface AdminDashboardProps {
  user: User
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  useAuth() // ensure session hydration

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || user.email}. Manage your annotation platform from here.
        </p>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger
            value="monitoring"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Monitoring</span>
          </TabsTrigger>
          <TabsTrigger
            value="annotators"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Annotators</span>
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <AnnotationMonitoring />
        </TabsContent>

        <TabsContent value="annotators" className="space-y-6">
          <AnnotatorManagement />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentOverview />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <DataConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  )
}
