"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Clock, TrendingUp, Award } from "lucide-react"
import type { User } from "@/lib/auth"
import { calculatePayment, calculateEfficiencyMetrics, formatCurrency, DEFAULT_RATES } from "@/lib/payment-calculator"

interface PaymentDashboardProps {
  user: User
}

interface AnnotatorStats {
  totalRows: number
  translations: number
  totalHours: number
  completedToday: number
  hoursToday: number
}

export function PaymentDashboard({ user }: PaymentDashboardProps) {
  const [stats, setStats] = useState<AnnotatorStats>({
    totalRows: 0,
    translations: 0,
    totalHours: 0,
    completedToday: 0,
    hoursToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const spreadsheetId = localStorage.getItem("annotation_spreadsheet_id")
      if (!spreadsheetId) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/annotations?spreadsheetId=${spreadsheetId}`)
      if (!response.ok) return

      const { annotations } = await response.json()

      // Filter annotations for current user
      const userAnnotations = annotations.filter((a: any) => a.annotatorId === user.id)

      // Calculate stats
      const today = new Date().toDateString()
      const todayAnnotations = userAnnotations.filter(
        (a: any) => new Date(a.startTime).toDateString() === today && a.status === "completed",
      )

      const totalRows = userAnnotations.filter((a: any) => a.status === "completed").length
      const translations = userAnnotations.filter((a: any) => a.translation && a.translation.trim().length > 0).length
      const totalMinutes = userAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)
      const todayMinutes = todayAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)

      setStats({
        totalRows,
        translations,
        totalHours: totalMinutes / 60,
        completedToday: todayAnnotations.length,
        hoursToday: todayMinutes / 60,
      })
    } catch (error) {
      // console.error("Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const payment = calculatePayment(stats.totalRows, stats.translations, stats.totalHours)
  const efficiency = calculateEfficiencyMetrics(stats.totalRows, stats.totalHours)
  const todayPayment = calculatePayment(stats.completedToday, 0, stats.hoursToday) // Simplified for today

  const getEfficiencyColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-orange-600"
      case "good":
        return "text-blue-600"
      case "average":
        return "text-yellow-600"
      default:
        return "text-red-600"
    }
  }

  const getEfficiencyBadge = (status: string) => {
    const colors = {
      excellent: "bg-orange-100 text-orange-800",
      good: "bg-blue-100 text-blue-800",
      average: "bg-yellow-100 text-yellow-800",
      "below-average": "bg-red-100 text-red-800",
    }
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payment.totalPayment)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRows} rows • {stats.translations} translations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayPayment.totalPayment)}</div>
            <p className="text-xs text-muted-foreground">{stats.completedToday} rows completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(efficiency.status)}`}>
              {efficiency.efficiency.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">{payment.avgRowsPerHour.toFixed(1)} rows/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{stats.hoursToday.toFixed(1)}h today</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
            <CardDescription>Detailed breakdown of your earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base Payment ({stats.totalRows} rows)</span>
              <span className="font-medium">{formatCurrency(payment.breakdown.rowPayment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Translation Bonus ({stats.translations} translations)
              </span>
              <span className="font-medium">{formatCurrency(payment.breakdown.translationPayment)}</span>
            </div>
            {payment.breakdown.bonus > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Performance Bonus</span>
                <span className="font-medium text-orange-600">{formatCurrency(payment.breakdown.bonus)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Earnings</span>
                <span className="text-lg font-bold">{formatCurrency(payment.totalPayment)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your annotation performance and efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Efficiency Rating</span>
                {getEfficiencyBadge(efficiency.status)}
              </div>
              <Progress value={Math.min(efficiency.efficiency, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">{efficiency.recommendation}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Progress to Bonus</span>
                <span className="text-sm font-medium">
                  {stats.totalRows}/{DEFAULT_RATES.bonusThreshold} rows
                </span>
              </div>
              <Progress value={(stats.totalRows / (DEFAULT_RATES.bonusThreshold || 50)) * 100} className="h-2" />
              {stats.totalRows >= (DEFAULT_RATES.bonusThreshold || 50) && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-medium">Bonus Unlocked!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold">{payment.avgRowsPerHour.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Rows/Hour</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {((stats.translations / Math.max(stats.totalRows, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Translation Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
