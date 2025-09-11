"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/custom-hooks/useAuth"
import { Home, Users, DollarSign, Activity, FileText, SettingsIcon, ShieldCheck, Languages } from "lucide-react"

type SidebarLinksProps = { onNavigate?: () => void }

export function SidebarLinks({ onNavigate }: SidebarLinksProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const role = user?.role || "annotator"
  const isAdmin = role === "admin"

  const NavLink = ({ href, label, Icon }: { href: string; label: string; Icon: any }) => {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          pathname === href && "bg-accent text-accent-foreground shadow-sm",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    )
  }

  return (
    <nav className="space-y-1 pt-2">
      {role === "annotator" && (
        <>
          <NavLink href="/dashboard/annotator" label="Dashboard" Icon={Home} />
          <NavLink href="/dashboard/annotator/tasks" label="Tasks" Icon={FileText} />
          <NavLink href="/dashboard/annotator/payments" label="Payments" Icon={DollarSign} />
          <NavLink href="/dashboard/annotator/verify" label="Verify" Icon={ShieldCheck} />
          <NavLink href="/dashboard/user/languages" label="Languages" Icon={Languages} />
        </>
      )}
      {isAdmin && (
        <>
          <NavLink href="/dashboard/admin" label="Dashboard" Icon={Home} />
          <NavLink href="/dashboard/admin/metrics" label="Metrics" Icon={Activity} />
          <NavLink href="/dashboard/admin/annotators" label="Annotators" Icon={Users} />
          <NavLink href="/dashboard/admin/verify" label="Verify" Icon={ShieldCheck} />
          <NavLink href="/dashboard/admin/payments" label="Payments" Icon={DollarSign} />
          <NavLink href="/dashboard/admin/config" label="Config" Icon={SettingsIcon} />
          <NavLink href="/dashboard/user/languages" label="My Languages" Icon={Languages} />
        </>
      )}
    </nav>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-[calc(100vh-56px)] flex-col gap-6 p-4 sticky top-14 w-full">
        <div className="px-2 pb-2 border-b border-border/50">
          <div className="text-sm font-semibold tracking-wide text-foreground">AfriBERTa NG</div>
          <div className="text-xs text-muted-foreground mt-0.5">Data Annotation Platform</div>
        </div>
        <SidebarLinks />

        <div className="mt-auto px-2 py-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">Version 2.0</div>
        </div>
      </div>
    </aside>
  )
}
