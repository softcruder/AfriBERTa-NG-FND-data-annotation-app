"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useMemo } from "react"
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
import { LogOut, ShieldCheck, Trash2, Settings, Home, User2 } from "lucide-react"
import { useConfig } from "@/custom-hooks/useConfig"
import { useVerifyAnnotation } from "@/custom-hooks/useQA"
import { useAnonymizeSelf } from "@/custom-hooks/useAnonymize"
import { useRequest } from "@/hooks/useRequest"
import type { AuthSession } from "@/lib/auth"

type HeaderUser = {
  id: string
  name: string
  email: string
  picture?: string
  role?: string
} | null

export function SiteHeader({ user }: { user: HeaderUser }) {
  const router = useRouter()
  const pathname = usePathname()
  const { spreadsheetId } = useConfig()
  const { anonymize } = useAnonymizeSelf()
  const { request } = useRequest<{ success: boolean }>()

  const isDashboard = pathname?.startsWith("/dashboard")

  const initial = useMemo(() => (user?.name ? user.name.charAt(0).toUpperCase() : "U"), [user?.name])

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
    if (isDashboard) {
      const el = document.getElementById("qa-section")
      if (el) el.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/70">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded" />
            <span className="font-semibold truncate">AfriBERTa NG</span>
          </Link>
          <nav className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="/dashboard" className={"hover:text-foreground flex items-center gap-1"}>
              <Home className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isDashboard && (
            <Button variant="outline" size="sm" onClick={goVerify}>
              <ShieldCheck className="h-4 w-4" /> Verify
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-1">
                <Avatar className="size-8">
                  <AvatarImage src={user?.picture || "/placeholder.svg"} alt={user?.name || "User"} />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="max-w-[240px] truncate">{user?.email || "Signed in"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Dashboard
                </Link>
              </DropdownMenuItem>
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
