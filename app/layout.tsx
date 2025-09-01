import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { AuthProvider } from "@/custom-hooks/useAuth"

export const metadata: Metadata = {
  title: "AfriBERTa NG | Data Annotation Platform",
  description: "Professional fake news detection annotation system",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
}

// SiteHeader reads the user from the AuthProvider; no need to fetch user here.

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
          </Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
