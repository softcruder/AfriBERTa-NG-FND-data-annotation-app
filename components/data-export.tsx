"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText, Calendar, Users, DollarSign, Clock } from "lucide-react"
import { exportConfigSchema, type ExportConfig } from "@/lib/validation"

interface DataExportProps {
  annotators: Array<{ id: string; name: string; email: string }>
  onExport: (config: ExportConfig) => Promise<void>
}

export function DataExport({ annotators, onExport }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const form = useForm<ExportConfig>({
    resolver: zodResolver(exportConfigSchema),
    defaultValues: {
      format: "csv",
      includePayments: false,
      includeTimeTracking: false,
    },
  })

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form
  const watchedValues = watch()

  const onSubmit = async (data: ExportConfig) => {
    setIsExporting(true)

    try {
      await onExport(data)
      toast({
        title: "Export Complete",
        description: "Export completed successfully! The file has been downloaded to your device.",
        variant: "success",
      })
    } catch (error) {
      // console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export & QA
        </CardTitle>
        <CardDescription>Export annotation data for quality assurance and analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Export Format</Label>
            <Select
              value={watchedValues.format}
              onValueChange={value => setValue("format", value as "csv" | "json" | "xlsx")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV - Comma Separated Values
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON - JavaScript Object Notation
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    XLSX - Excel Spreadsheet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-date" className="text-sm">
                  From
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  onChange={e => setValue("dateRange.from", new Date(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-sm">
                  To
                </Label>
                <Input id="to-date" type="date" onChange={e => setValue("dateRange.to", new Date(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Annotator Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Annotators (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {annotators.map(annotator => (
                <div key={annotator.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`annotator-${annotator.id}`}
                    onChange={e => {
                      const currentAnnotators = watchedValues.annotators || []
                      if (e.target.checked) {
                        setValue("annotators", [...currentAnnotators, annotator.id])
                      } else {
                        setValue(
                          "annotators",
                          currentAnnotators.filter(id => id !== annotator.id),
                        )
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`annotator-${annotator.id}`} className="text-sm">
                    {annotator.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Data Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Additional Data</Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="include-payments" className="text-sm">
                  Include Payment Data
                </Label>
              </div>
              <Switch
                id="include-payments"
                checked={watchedValues.includePayments}
                onCheckedChange={checked => setValue("includePayments", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="include-time" className="text-sm">
                  Include Time Tracking Data
                </Label>
              </div>
              <Switch
                id="include-time"
                checked={watchedValues.includeTimeTracking}
                onCheckedChange={checked => setValue("includeTimeTracking", checked)}
              />
            </div>
          </div>

          {/* Export Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Export Summary</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                Format: <Badge variant="secondary">{watchedValues.format.toUpperCase()}</Badge>
              </div>
              {watchedValues.dateRange && (
                <div>
                  {(() => {
                    const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" })
                    const from = watchedValues.dateRange.from ? fmt.format(watchedValues.dateRange.from) : ""
                    const to = watchedValues.dateRange.to ? fmt.format(watchedValues.dateRange.to) : ""
                    return (
                      <>
                        Date Range: {from} - {to}
                      </>
                    )
                  })()}
                </div>
              )}
              {watchedValues.annotators && watchedValues.annotators.length > 0 && (
                <div>Annotators: {watchedValues.annotators.length} selected</div>
              )}
              <div>
                Additional Data:
                {watchedValues.includePayments && " Payments"}
                {watchedValues.includeTimeTracking && " Time Tracking"}
                {!watchedValues.includePayments && !watchedValues.includeTimeTracking && " None"}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isExporting} className="w-full">
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
