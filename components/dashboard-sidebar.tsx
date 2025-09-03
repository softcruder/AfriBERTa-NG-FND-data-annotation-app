"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/custom-hooks/useAuth"
import {
  Home,
  Users,
  DollarSign,
  Activity,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  Languages,
} from "lucide-react"

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
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50",
          pathname === href && "bg-muted text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </Link>
    )
  }

  return (
    <div className="space-y-1 pt-2">
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
          <NavLink href="/dashboard/admin/payments" label="Payments" Icon={DollarSign} />
          <NavLink href="/dashboard/admin/config" label="Config" Icon={SettingsIcon} />
          <NavLink href="/dashboard/user/languages" label="My Languages" Icon={Languages} />
        </>
      )}
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex md:max-w-64 shrink-0 border-r bg-background/50">
      <div className="flex h-[calc(100vh-56px)] flex-col gap-[24px] p-[16px] sticky top-14">
        <div className="px-2 pb-2">
          <div className="text-sm tracking-wide text-muted-foreground">AfriBERTa NG</div>
        </div>
        <SidebarLinks />
      </div>
    </aside>
  )
}
