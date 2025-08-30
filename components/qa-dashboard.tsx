"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertTriangle, XCircle, Users, Clock, Target, BarChart3, RefreshCw } from "lucide-react"

interface QAMetrics {
  totalAnnotations: number
  completedAnnotations: number
  averageTimePerTask: number
  qualityScore: number
  annotatorPerformance: Array<{
    id: string
    name: string
    completed: number
    averageTime: number
    qualityScore: number
    efficiency: number
  }>
  flaggedAnnotations: Array<{
    id: string
    annotatorName: string
    reason: string
    severity: "low" | "medium" | "high"
  }>
}

interface QADashboardProps {
  metrics: QAMetrics
  onRefresh: () => void
}

export function QADashboard({ metrics, onRefresh }: QADashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  const completionRate = (metrics.completedAnnotations / metrics.totalAnnotations) * 100
  const averageQuality =
    metrics.annotatorPerformance.reduce((acc, perf) => acc + perf.qualityScore, 0) / metrics.annotatorPerformance.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quality Assurance Dashboard</h2>
          <p className="text-muted-foreground">Monitor annotation quality and performance metrics</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold">{averageQuality.toFixed(1)}/10</p>
              </div>
            </div>
            <Badge
              variant={averageQuality >= 8 ? "default" : averageQuality >= 6 ? "secondary" : "destructive"}
              className="mt-2"
            >
              {averageQuality >= 8 ? "Excellent" : averageQuality >= 6 ? "Good" : "Needs Improvement"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time/Task</p>
                <p className="text-2xl font-bold">{metrics.averageTimePerTask.toFixed(1)}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Annotators</p>
                <p className="text-2xl font-bold">{metrics.annotatorPerformance.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Annotator Performance</CardTitle>
              <CardDescription>Individual performance metrics and efficiency scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.annotatorPerformance.map((annotator) => (
                  <div key={annotator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{annotator.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Completed: {annotator.completed}</span>
                        <span>Avg Time: {annotator.averageTime.toFixed(1)}m</span>
                        <span>Quality: {annotator.qualityScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          annotator.efficiency >= 90
                            ? "default"
                            : annotator.efficiency >= 70
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {annotator.efficiency.toFixed(0)}% Efficiency
                      </Badge>
                      <Badge
                        variant={
                          annotator.qualityScore >= 8
                            ? "default"
                            : annotator.qualityScore >= 6
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {annotator.qualityScore >= 8
                          ? "High Quality"
                          : annotator.qualityScore >= 6
                            ? "Good Quality"
                            : "Needs Review"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Issues</CardTitle>
              <CardDescription>Flagged annotations requiring review</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.flaggedAnnotations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Quality Issues Found</p>
                  <p className="text-muted-foreground">All annotations meet quality standards</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.flaggedAnnotations.map((flag) => (
                    <Alert
                      key={flag.id}
                      className={`${
                        flag.severity === "high"
                          ? "border-red-200 bg-red-50"
                          : flag.severity === "medium"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {flag.severity === "high" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : flag.severity === "medium" ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                        <Badge
                          variant={
                            flag.severity === "high"
                              ? "destructive"
                              : flag.severity === "medium"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {flag.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <AlertDescription className="mt-2">
                        <strong>{flag.annotatorName}</strong>: {flag.reason}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Overview
              </CardTitle>
              <CardDescription>Detailed performance analytics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Productivity Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tasks Completed Today</span>
                      <span className="font-medium">{metrics.completedAnnotations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Quality Score</span>
                      <span className="font-medium">{averageQuality.toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency Rate</span>
                      <span className="font-medium">{completionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quality Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">High Quality Annotations</span>
                      <span className="font-medium">
                        {metrics.annotatorPerformance.filter((a) => a.qualityScore >= 8).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Flagged for Review</span>
                      <span className="font-medium">{metrics.flaggedAnnotations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Critical Issues</span>
                      <span className="font-medium text-red-600">
                        {metrics.flaggedAnnotations.filter((f) => f.severity === "high").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
