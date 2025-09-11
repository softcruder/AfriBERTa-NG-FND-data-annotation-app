import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SiteHeader />
      <div className="min-h-[calc(100vh-56px)] flex bg-background">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 bg-gradient-to-br from-background to-muted/20">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
