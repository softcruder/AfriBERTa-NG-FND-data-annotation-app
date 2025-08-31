"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRequest } from "@/hooks/useRequest"

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function LogoutButton({ variant = "outline", size = "default" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const { request } = useRequest<{ success: boolean }>()
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await request.post("/auth/logout")
      router.push("/")
      router.refresh()
    } catch (error) {
      // console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant={variant} size={size}>
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  )
}
