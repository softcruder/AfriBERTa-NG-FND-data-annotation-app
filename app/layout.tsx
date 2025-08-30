import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ConfigProvider } from "@/custom-hooks/useConfig"
import { cookies } from "next/headers"
import { getSessionFromCookie } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "AfriBERTa NG | Data Annotation Platform",
  description: "Professional fake news detection annotation system",
  generator: "v0+co-pilot",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
}

async function getUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("auth_session")
    if (!sessionCookie) return null
    const session = getSessionFromCookie(sessionCookie.value)
    return session?.user ?? null
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getUser()
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ConfigProvider>
          <Suspense fallback={null}>
            <SiteHeader user={user} />
            {children}
            <Toaster />
          </Suspense>
        </ConfigProvider>
        <Analytics />
      </body>
    </html>
  )
}
