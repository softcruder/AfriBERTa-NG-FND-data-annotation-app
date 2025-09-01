import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="min-h-[calc(100vh-56px)] flex">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-3 md:p-6">{children}</main>
      </div>
    </>
  )
}
