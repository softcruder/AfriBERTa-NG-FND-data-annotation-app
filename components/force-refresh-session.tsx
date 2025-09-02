import { useAuth } from "@/custom-hooks/useAuth"
import { Button } from "@/components/ui/button"

export function ForceRefreshSession() {
  const { logout } = useAuth()

  const handleForceRefresh = async () => {
    // Clear all client-side cache and force re-authentication
    if (typeof window !== "undefined") {
      // Clear localStorage
      localStorage.clear()
      // Clear sessionStorage
      sessionStorage.clear()
      // Force logout which will redirect to login
      await logout()
    }
  }

  return (
    <Button onClick={handleForceRefresh} variant="outline" size="sm">
      Force Refresh Session
    </Button>
  )
}
