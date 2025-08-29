import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface HomePageProps {
  searchParams: { error?: string }
}

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")

  if (!sessionCookie) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  const { error } = searchParams

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "auth_failed":
        return "Authentication failed. Please try again."
      case "no_code":
        return "Authorization code not received. Please try again."
      default:
        return "An error occurred during login. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Annotation Platform</h1>
          <p className="text-muted-foreground">Professional fake news detection annotation system</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
