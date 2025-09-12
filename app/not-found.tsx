"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Home, ArrowLeft } from "lucide-react"
import React from "react"

function BackButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="flex-1 gap-2 focus-ring"
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back()
        } else {
          window.location.assign("/dashboard")
        }
      }}
    >
      <ArrowLeft className="h-4 w-4" /> Go Back
    </Button>
  )
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background to-card">
      <Card className="w-full max-w-md shadow-lg border-foreground/10">
        <CardContent className="pt-8 pb-10 flex flex-col items-center text-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shadow-inner">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              The page you are looking for doesn&apos;t exist or was moved. Check the URL or use the navigation below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild variant="default" className="flex-1 gap-2 focus-ring">
              <Link href="/dashboard" className="flex items-center justify-center gap-[10px] w-full">
                <Home className="h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <BackButton />
          </div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">AfriBERTa NG Platform</p>
        </CardContent>
      </Card>
    </div>
  )
}
