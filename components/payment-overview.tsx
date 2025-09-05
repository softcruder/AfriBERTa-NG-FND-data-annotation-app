"use client"

import { formatMoney } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, Clock, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth, usePayments } from "@/custom-hooks"

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
  qaCount: number
  qaTotal: number
  approvedAnnotations: number
  approvedTranslations: number
  redeemableAmount: number
}

export function PaymentOverview() {
  const { toast } = useToast()
  const { spreadsheetId } = useAuth()
  const { data: swrPayments, isLoading: paying } = usePayments(spreadsheetId)

  // Derive payments directly from SWR data
  const payments: PaymentSummary[] = Array.isArray(swrPayments)
    ? (swrPayments as any[]).map((payment: any) => ({
        ...payment,
        annotatorName: payment.annotatorName || `User ${payment.annotatorId.slice(-4)}`,
      }))
    : []

  const handleExportPayments = () => {
    if (payments.length === 0) {
      toast({
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
      "QA Count",
      "QA Payment",
      "Approved Annotations",
      "Approved Translations",
      "Redeemable Amount",
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
          p.qaCount,
          `₦${p.qaTotal}`,
          p.approvedAnnotations,
          p.approvedTranslations,
          `₦${p.redeemableAmount}`,
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
  const totalRedeemable = payments.reduce((sum, p) => sum + p.redeemableAmount, 0)
  const totalRows = payments.reduce((sum, p) => sum + p.totalRows, 0)
  const totalTranslations = payments.reduce((sum, p) => sum + p.translations, 0)
  const totalQA = payments.reduce((sum, p) => sum + p.qaCount, 0)

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney("₦", totalPayments)}</div>
            <p className="text-xs text-muted-foreground">all activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney("₦", totalRedeemable)}</div>
            <p className="text-xs text-muted-foreground">approved only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRows}</div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Reviews</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQA}</div>
            <p className="text-xs text-muted-foreground">performed</p>
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
          {paying ? (
            <div className="text-center py-8 text-muted-foreground">Loading payment data...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payment data available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Annotator</TableHead>
                  <TableHead>Annotations</TableHead>
                  <TableHead>Translations</TableHead>
                  <TableHead>QA Count</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Redeemable</TableHead>
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
                      <div className="space-y-1">
                        <Badge variant="outline">{payment.totalRows}</Badge>
                        <div className="text-xs text-muted-foreground">{payment.avgRowsPerHour.toFixed(1)}/hr</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.translations}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {payment.qaCount}
                        </Badge>
                        <div className="text-xs text-muted-foreground">{formatMoney("₦", payment.qaTotal)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-green-600">{payment.approvedAnnotations}</span>
                          {payment.approvedTranslations > 0 && (
                            <span className="text-muted-foreground"> + {payment.approvedTranslations}T</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">approved</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{formatMoney("₦", payment.totalPayment)}</Badge>
                        <div className="text-xs text-muted-foreground">all activities</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatMoney("₦", payment.redeemableAmount)}
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
