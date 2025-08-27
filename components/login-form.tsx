"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement Google OAuth login
      console.log("Google OAuth login initiated")
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in with your Google account to access the annotation platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-12 text-base" size="lg">
          <Chrome className="mr-2 h-5 w-5" />
          {isLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure authentication powered by Google OAuth</p>
        </div>
      </CardContent>
    </Card>
  )
}
