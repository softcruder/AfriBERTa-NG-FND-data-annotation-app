import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getSessionFromCookie } from "@/lib/auth"
import Image from "next/image"
interface ErrorResponse {
  error?: string
}
interface HomePageProps {
  searchParams?: Promise<ErrorResponse> | ErrorResponse
}

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("auth_session")

  if (!sessionCookie) {
    return null
  }

  return getSessionFromCookie(sessionCookie.value)
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }
  // If searchParams is a promise (dynamic API), await it
  const resolvedSearchParams = await searchParams
  const { error } = resolvedSearchParams || {}

  const getErrorMessage = (error?: string) => {
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
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="AfriBERTa NG Logo" width={80} height={80} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">AfriBERTa NG</h1>
          <h2 className="text-xl font-semibold text-primary mb-2">Data Annotation Platform</h2>
          <p className="text-muted-foreground text-balance">For cross-lingual fake news detection system</p>
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
