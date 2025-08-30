import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ConfigProvider } from "@/custom-hooks/useConfig"

export const metadata: Metadata = {
  title: "AfriBERTa NG | Data Annotation Platform",
  description: "Professional fake news detection annotation system",
  generator: "v0+co-pilot",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ConfigProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
          </Suspense>
        </ConfigProvider>
        <Analytics />
      </body>
    </html>
  )
}
