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
    <div className="container mx-auto p-6">
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
          <AnnotationMonitoring />
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
