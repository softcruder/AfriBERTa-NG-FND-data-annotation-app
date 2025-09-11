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
  searchParams?: Promise<ErrorResponse> | Promise<ErrorResponse | undefined> | undefined
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
      case "session_expired":
        return "Your session has expired. Please log in again."
      default:
        return "An error occurred during login. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="AfriBERTa NG Logo"
                width={80}
                height={80}
                className="rounded-xl shadow-lg ring-4 ring-primary/10"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-primary/10 to-transparent" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 text-balance tracking-tight">AfriBERTa NG</h1>
          <h2 className="text-xl font-semibold text-primary mb-4 text-balance">Data Annotation Platform</h2>
          <p className="text-muted-foreground text-balance leading-relaxed max-w-sm mx-auto">
            Developing an explainable cross-lingual fake news detection model using advanced transfer learning
            techniques.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
          <LoginForm />
        </div>

        <div className="text-center mt-6 text-xs text-muted-foreground">Version 2.0 • Powered by Next.js</div>
      </div>
    </div>
  )
}
