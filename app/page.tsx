import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Annotation Platform</h1>
          <p className="text-muted-foreground">Professional fake news detection annotation system</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
