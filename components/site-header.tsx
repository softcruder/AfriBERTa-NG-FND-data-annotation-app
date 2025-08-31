"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  LogOut,
  ShieldCheck,
  Trash2,
  Settings as SettingsIcon,
  Home,
  Users,
  DollarSign,
  Activity,
  FileText,
} from "lucide-react"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { useAnonymizeSelf } from "@/custom-hooks/useAnonymize"
import { useRequest } from "@/hooks/useRequest"
import { MobileSidebar } from "@/components/mobile-sidebar"

type HeaderUser = {
  id: string
  name: string
  email: string
  picture?: string
  role?: string
} | null

import { useAuth } from "@/custom-hooks/useAuth"

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { anonymize } = useAnonymizeSelf()
  const { request } = useRequest<{ success: boolean }>()
  const { user } = useAuth()
  const [navLoading, setNavLoading] = useState(false)

  const isDashboard = pathname?.startsWith("/dashboard")
  const role = (user?.role as string) || "annotator"
  const isAdmin = role === "admin"
  const isAnnotator = role === "annotator"

  // Hide header on login screen or when unauthenticated
  if (!user) return null

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U"

  const handleLogout = async () => {
    try {
      await request.post("/auth/logout")
      router.push("/")
      router.refresh()
    } catch {}
  }

  const handleAnonymize = async () => {
    try {
      const res = await anonymize()
      if ((res as any)?.success) {
        // noop; could toast here
      }
    } catch {}
  }

  const goVerify = () => {
    setNavLoading(true)
    const target = role === "admin" ? "/dashboard/admin/metrics" : "/dashboard/annotator/verify"
    router.push(target)
    // give a brief grace period for transition; Next will reset when page renders
    setTimeout(() => setNavLoading(false), 1200)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/70">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar trigger */}
          {isDashboard && <MobileSidebar />}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
          </Link>
          {/* Inline nav removed to avoid duplication and extra requests; sidebar handles navigation */}
        </div>
        <div className="flex items-center gap-2">
          {isDashboard && (
            <Button variant="outline" size="sm" onClick={goVerify} disabled={navLoading}>
              {navLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                  Loading
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Verify
                </span>
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Avatar trigger with refined hover/focus styles */}
              <Button
                variant="ghost"
                size="sm"
                aria-label="User menu"
                className="p-0 rounded-full hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-transparent"
              >
                <Avatar className="size-8">
                  <AvatarImage src={user?.picture || "/placeholder.svg"} alt={user?.name || "User"} />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="max-w-[240px] truncate flex items-center justify-between gap-2">
                <span>{user?.email || "Signed in"}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded border bg-muted text-muted-foreground uppercase tracking-wide"
                  aria-label={`Role: ${role}`}
                >
                  {role}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={isAdmin ? "/dashboard/admin" : "/dashboard/annotator"} className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
              {isAnnotator && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/annotator/tasks" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Tasks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/annotator/payments" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Payments
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/metrics" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Metrics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/annotators" className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Annotators
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/payments" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Payments
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/config" className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4" /> Config
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={goVerify} className="gap-2">
                <ShieldCheck className="h-4 w-4" /> Verify others&apos; work
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAnonymize} className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete my data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
