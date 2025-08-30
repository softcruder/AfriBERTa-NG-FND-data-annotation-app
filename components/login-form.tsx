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
      // console.log("Google OAuth login initiated")

      // Build Google OAuth URL
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      googleAuthUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
      googleAuthUrl.searchParams.set("redirect_uri", process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "")
      googleAuthUrl.searchParams.set("response_type", "code")
      googleAuthUrl.searchParams.set(
        "scope",
        "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets",
      )
      googleAuthUrl.searchParams.set("access_type", "offline")
      googleAuthUrl.searchParams.set("prompt", "consent")

      // Redirect to Google OAuth
      window.location.href = googleAuthUrl.toString()
    } catch (error) {
      // console.error("Login failed:", error)
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
          {isLoading ? "Redirecting to Google..." : "Continue with Google"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure authentication powered by Google OAuth</p>
        </div>
      </CardContent>
    </Card>
  )
}
