"use client"

import { useState, useEffect } from "react"
import { formatMoney } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, Clock, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentSummary {
  annotatorId: string
  annotatorName: string
  totalRows: number
  translations: number
  avgRowsPerHour: number
  totalHours: number
  paymentRows: number
  paymentTranslations: number
  totalPayment: number
}

export function PaymentOverview() {
  const [payments, setPayments] = useState<PaymentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const spreadsheetId = localStorage.getItem("annotation_spreadsheet_id")
      if (!spreadsheetId) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/payments?spreadsheetId=${spreadsheetId}`)
      if (!response.ok) throw new Error("Failed to load payments")

      const { payments: paymentData } = await response.json()

      // Transform data and add mock names
      const paymentsWithNames: PaymentSummary[] = paymentData.map((payment: any) => ({
        ...payment,
        annotatorName: `Annotator ${payment.annotatorId.slice(-4)}`, // Mock name
      }))

      setPayments(paymentsWithNames)
    } catch (error) {
      // console.error("Error loading payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPayments = () => {
    if (payments.length === 0) {
      toast({
        title: "Export Error",
        description: "No payment data to export",
        variant: "destructive",
      })
      return
    }

    const headers = [
      "Annotator ID",
      "Annotator Name",
      "Total Rows",
      "Translations",
      "Avg Rows/Hour",
      "Total Hours",
      "Payment (Rows)",
      "Payment (Translations)",
      "Total Payment",
    ]

    const csvContent = [
      headers.join(","),
      ...payments.map(p =>
        [
          p.annotatorId,
          p.annotatorName,
          p.totalRows,
          p.translations,
          p.avgRowsPerHour.toFixed(2),
          p.totalHours.toFixed(2),
          `₦${p.paymentRows}`,
          `₦${p.paymentTranslations}`,
          `₦${p.totalPayment}`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
  const today = new Date()
  const yyyy = today.getUTCFullYear()
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(today.getUTCDate()).padStart(2, "0")
  a.download = `payment_summary_${yyyy}-${mm}-${dd}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalPayments = payments.reduce((sum, p) => sum + p.totalPayment, 0)
  const totalRows = payments.reduce((sum, p) => sum + p.totalRows, 0)
  const totalTranslations = payments.reduce((sum, p) => sum + p.translations, 0)

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney("₦", totalPayments)}</div>
            <p className="text-xs text-muted-foreground">across all annotators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRows}</div>
            <p className="text-xs text-muted-foreground">completed annotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTranslations}</div>
            <p className="text-xs text-muted-foreground">with translations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length > 0
                ? (payments.reduce((sum, p) => sum + p.avgRowsPerHour, 0) / payments.length).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">rows per hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Breakdown</CardTitle>
              <CardDescription>Detailed payment information for each annotator</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportPayments}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payment data...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payment data available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Annotator</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Translations</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Row Payment</TableHead>
                  <TableHead>Translation Payment</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.annotatorId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {payment.annotatorName
                              .split(" ")
                              .map(n => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{payment.annotatorName}</div>
                          <div className="text-xs text-muted-foreground">{payment.annotatorId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.totalRows}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.translations}</Badge>
                    </TableCell>
                    <TableCell>{payment.totalHours.toFixed(1)}h</TableCell>
                    <TableCell>{payment.avgRowsPerHour.toFixed(1)}/hr</TableCell>
                    <TableCell>{formatMoney("₦", payment.paymentRows)}</TableCell>
                    <TableCell>{formatMoney("₦", payment.paymentTranslations)}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-orange-100 text-orange-800">
                        {formatMoney("₦", payment.totalPayment)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
