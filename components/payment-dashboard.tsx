"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Clock, TrendingUp, Award, Target, Zap } from "lucide-react"
import type { User } from "@/lib/auth"
import { calculatePayment, calculateEfficiencyMetrics, formatCurrency } from "@/lib/payment-calculator"
import { useAuth, useAnnotations, usePaymentConfig } from "@/custom-hooks"

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
  const { spreadsheetId } = useAuth()
  const { data: annotations } = useAnnotations(spreadsheetId)
  const { paymentRates } = usePaymentConfig()

  const stats: AnnotatorStats = useMemo(() => {
    const anns = annotations || []
    if (!anns.length) {
      return { totalRows: 0, translations: 0, totalHours: 0, completedToday: 0, hoursToday: 0 }
    }

    const userAnnotations = anns.filter((a: any) => a.annotatorId === user.id)
    const today = new Date().toDateString()
    const todayAnnotations = userAnnotations.filter(
      (a: any) => new Date(a.startTime).toDateString() === today && a.status === "completed",
    )

    const totalRows = userAnnotations.filter((a: any) => a.status === "completed").length
    const translations = userAnnotations.filter((a: any) => a.translation && a.translation.trim().length > 0).length
    const totalMinutes = userAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)
    const todayMinutes = todayAnnotations.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0)

    return {
      totalRows,
      translations,
      totalHours: totalMinutes / 60,
      completedToday: todayAnnotations.length,
      hoursToday: todayMinutes / 60,
    }
  }, [annotations, user.id])

  // Calculate payment with new signature: (annotations, translations, qa, hours, rates, userLanguages)
  const userLanguagesString = user.translationLanguages?.join(",") || ""
  const payment = calculatePayment(
    stats.totalRows,
    stats.translations,
    0,
    stats.totalHours,
    paymentRates,
    userLanguagesString,
  )
  const efficiency = calculateEfficiencyMetrics(stats.totalRows, stats.totalHours)
  const todayPayment = calculatePayment(stats.completedToday, 0, 0, stats.hoursToday, paymentRates, userLanguagesString)

  const getEfficiencyColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-emerald-600"
      case "good":
        return "text-blue-600"
      case "average":
        return "text-amber-600"
      default:
        return "text-red-600"
    }
  }

  const getEfficiencyBadge = (status: string) => {
    const colors = {
      excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
      good: "bg-blue-100 text-blue-800 border-blue-200",
      average: "bg-amber-100 text-amber-800 border-amber-200",
      "below-average": "bg-red-100 text-red-800 border-red-200",
    }
    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Payment Dashboard</h2>
        <p className="text-muted-foreground">Track your earnings, performance metrics, and payment breakdown.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(payment.totalPayment)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Target className="h-3 w-3" />
              {stats.totalRows} rows • {stats.translations} translations
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(todayPayment.totalPayment)}</div>
            <p className="text-xs text-muted-foreground">{stats.completedToday} rows completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency</CardTitle>
            <Zap className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(efficiency.status)}`}>
              {efficiency.efficiency.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">{payment.avgAnnotationsPerHour.toFixed(1)} rows/hour</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Worked</CardTitle>
            <Clock className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{stats.hoursToday.toFixed(1)}h today</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payment Breakdown
            </CardTitle>
            <CardDescription>Detailed breakdown of your earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Base Payment ({stats.totalRows} rows)</span>
              <span className="font-bold text-foreground">{formatCurrency(payment.breakdown.annotationPayment)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Translation Bonus ({stats.translations} translations)</span>
              <span className="font-bold text-foreground">{formatCurrency(payment.breakdown.translationPayment)}</span>
            </div>
            {payment.breakdown.bonus > 0 && (
              <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-sm font-medium text-emerald-800">Performance Bonus</span>
                <span className="font-bold text-emerald-600">{formatCurrency(payment.breakdown.bonus)}</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-semibold text-foreground">Total Earnings</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(payment.totalPayment)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Your annotation performance and efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Efficiency Rating</span>
                {getEfficiencyBadge(efficiency.status)}
              </div>
              <Progress value={Math.min(efficiency.efficiency, 100)} className="h-3" />
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{efficiency.recommendation}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Progress to Bonus</span>
                <span className="text-sm font-bold text-foreground">
                  {stats.totalRows}/{paymentRates.bonusThreshold} rows
                </span>
              </div>
              <Progress value={(stats.totalRows / (paymentRates.bonusThreshold || 50)) * 100} className="h-3" />
              {stats.totalRows >= (paymentRates.bonusThreshold || 50) && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Bonus Unlocked!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">{payment.avgAnnotationsPerHour.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground font-medium">Rows/Hour</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">
                  {((stats.translations / Math.max(stats.totalRows, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground font-medium">Translation Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
