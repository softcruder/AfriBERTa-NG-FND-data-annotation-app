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
import { LogOut, ShieldCheck, Trash2, SettingsIcon, Home, Users, DollarSign, Activity, FileText } from "lucide-react"
import { useAnonymizeSelf } from "@/custom-hooks/useAnonymize"
import { useRequest } from "@/hooks/useRequest"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

import { useAuth } from "@/custom-hooks/useAuth"

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { anonymize } = useAnonymizeSelf()
  const { request } = useRequest<{ success: boolean }>()
  const { user, isAdmin, isAnnotator, logout } = useAuth()
  const [navLoading, setNavLoading] = useState(false)

  const isDashboard = pathname?.startsWith("/dashboard")
  const role = (user?.role as string) || "annotator"

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U"

  const handleLogout = async () => {
    try {
      await logout()
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
    const target = role === "admin" ? "/dashboard/admin/verify" : "/dashboard/annotator/verify"
    router.push(target)
    // give a brief grace period for transition; Next will reset when page renders
    setTimeout(() => setNavLoading(false), 1200)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-3 sm:px-4 gap-2 [padding-top:env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile sidebar trigger */}
          {isDashboard && <MobileSidebar />}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
            <span className="hidden sm:block font-semibold text-sm">AfriBERTa NG</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isDashboard && (
            <>
              {/* Full button on >=sm screens */}
              <Button
                variant="outline"
                size="sm"
                onClick={goVerify}
                disabled={navLoading}
                className="gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 hidden xs:flex"
              >
                {navLoading ? <LoadingSpinner size="sm" /> : <ShieldCheck className="h-4 w-4" />}
                <span className="hidden sm:inline">Verify</span>
                <span className="sm:hidden">Go</span>
              </Button>
              {/* Icon-only compact button for very small screens */}
              <Button
                variant="outline"
                size="icon"
                onClick={goVerify}
                disabled={navLoading}
                aria-label="Go to verification"
                className="bg-primary/5 hover:bg-primary/10 border-primary/20 xs:hidden"
              >
                {navLoading ? <LoadingSpinner size="sm" /> : <ShieldCheck className="h-4 w-4" />}
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="User menu"
                className="p-0 rounded-full hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-accent/50"
              >
                <Avatar className="size-9 sm:size-8 ring-2 ring-background shadow-sm">
                  <AvatarImage src={user?.picture || "/placeholder-user.png"} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[17rem] max-w-[80vw] max-h-[80vh] overflow-y-auto overscroll-contain p-1"
            >
              <DropdownMenuLabel className="flex items-center justify-between gap-2">
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-sm font-medium truncate" title={user?.name || "User"}>
                    {user?.name || "User"}
                  </span>
                  <span
                    className="text-xs text-muted-foreground truncate max-w-[10rem]"
                    title={user?.email || "Signed in"}
                  >
                    {user?.email || "Signed in"}
                  </span>
                </div>
                <span
                  className="text-[10px] px-2 py-1 rounded-full border bg-primary/10 text-primary uppercase tracking-wide font-medium"
                  aria-label={`Role: ${role}`}
                >
                  {role}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={isAdmin ? "/dashboard/admin" : "/dashboard/annotator"} className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> <span className="truncate">Dashboard</span>
                </Link>
              </DropdownMenuItem>

              {isAnnotator && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/annotator/tasks" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> <span className="truncate">Tasks</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/annotator/payments" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> <span className="truncate">Payments</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/metrics" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> <span className="truncate">Metrics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/annotators" className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> <span className="truncate">Annotators</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/payments" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> <span className="truncate">Payments</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/verify" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> <span className="truncate">Verify Tasks</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin/config" className="flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4" /> <span className="truncate">Config</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleAnonymize}
                className="gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <Trash2 className="h-4 w-4" /> <span className="truncate">Delete my data</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
              >
                <LogOut className="h-4 w-4" /> <span className="truncate">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
