"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/custom-hooks/useAuth"
import { Home, Users, DollarSign, Activity, FileText, Settings as SettingsIcon, ShieldCheck } from "lucide-react"

type SidebarLinksProps = { onNavigate?: () => void }

export function SidebarLinks({ onNavigate }: SidebarLinksProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const role = user?.role || "annotator"
  const isAdmin = role === "admin"

  const link = (href: string, label: string, Icon: any) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50",
        pathname === href && "bg-muted text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </Link>
  )

  return (
    <div className="space-y-1 pt-2">
      {role === "annotator" && (
        <>
          {link("/dashboard/annotator", "Dashboard", Home)}
          {link("/dashboard/annotator/tasks", "Tasks", FileText)}
          {link("/dashboard/annotator/payments", "Payments", DollarSign)}
          {link("/dashboard/annotator/verify", "Verify", ShieldCheck)}
          {/* Settings removed to declutter */}
        </>
      )}
      {isAdmin && (
        <>
          {link("/dashboard/admin", "Dashboard", Home)}
          {link("/dashboard/admin/metrics", "Metrics", Activity)}
          {link("/dashboard/admin/annotators", "Annotators", Users)}
          {link("/dashboard/admin/payments", "Payments", DollarSign)}
          {link("/dashboard/admin/config", "Config", SettingsIcon)}
          {/* Settings removed to declutter */}
        </>
      )}
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r bg-background/50">
      <div className="flex h-[calc(100vh-56px)] flex-col gap-3 p-4 sticky top-14">
        <div className="px-2 pb-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">AfriBERTa NG</div>
        </div>
        <SidebarLinks />
      </div>
    </aside>
  )
}
