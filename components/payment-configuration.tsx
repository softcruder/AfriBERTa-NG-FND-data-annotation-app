"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentConfig } from "@/custom-hooks"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/payment-calculator"
import type { PaymentConfig } from "@/lib/payment-calculator"

// Zod schema for payment configuration validation
const paymentConfigSchema = z.object({
  perRowRate: z
    .string()
    .min(1, "Per row rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Per row rate must be a positive number",
    }),
  perTranslationRate: z
    .string()
    .min(1, "Per translation rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Per translation rate must be a positive number",
    }),
  bonusThreshold: z
    .string()
    .min(1, "Bonus threshold is required")
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)), {
      message: "Bonus threshold must be a positive integer",
    }),
  bonusRate: z
    .string()
    .min(1, "Bonus rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 1, {
      message: "Bonus rate must be between 0 and 1 (e.g., 0.1 for 10%)",
    }),
})

type PaymentConfigFormData = z.infer<typeof paymentConfigSchema>

interface PaymentConfigurationProps {
  className?: string
}

export function PaymentConfiguration({ className }: PaymentConfigurationProps) {
  const { paymentConfig, paymentRates, defaultRates, isLoading, updating, updatePaymentConfig } = usePaymentConfig()

  const form = useForm<PaymentConfigFormData>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      perRowRate: "",
      perTranslationRate: "",
      bonusThreshold: "",
      bonusRate: "",
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = form

  // Update form when config loads
  React.useEffect(() => {
    if (paymentConfig && !isLoading) {
      reset({
        perRowRate: paymentConfig.perRowRate,
        perTranslationRate: paymentConfig.perTranslationRate,
        bonusThreshold: paymentConfig.bonusThreshold,
        bonusRate: paymentConfig.bonusRate,
      })
    }
  }, [paymentConfig, isLoading, reset])

  const onSubmit = async (data: PaymentConfigFormData) => {
    try {
      // Show immediate feedback
      toast({
        title: "Saving Payment Configuration...",
        description: "This may take a few moments. Please wait.",
      })

      await updatePaymentConfig(data)

      toast({
        title: "Payment Configuration Updated",
        description: "Payment rates have been successfully updated.",
      })
    } catch (error: any) {
      const isTimeout = error?.message?.includes("timeout")
      toast({
        title: "Error",
        description: isTimeout
          ? "Save operation timed out. Please check your connection and try again."
          : "Failed to update payment configuration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    reset({
      perRowRate: paymentConfig?.perRowRate || "",
      perTranslationRate: paymentConfig?.perTranslationRate || "",
      bonusThreshold: paymentConfig?.bonusThreshold || "",
      bonusRate: paymentConfig?.bonusRate || "",
    })
  }

  // Watch form values for preview
  const watchedValues = watch()

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Configuration</CardTitle>
        <CardDescription>
          Configure payment rates for annotations and translations. Changes will be applied to all future calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Per Row Rate */}
            <div className="space-y-2">
              <Label htmlFor="perRowRate">Payment Per Row (₦)</Label>
              <Input
                id="perRowRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.perRow.toString()}
                {...register("perRowRate")}
              />
              {errors.perRowRate && <p className="text-sm text-destructive">{errors.perRowRate.message}</p>}
              <p className="text-sm text-muted-foreground">Current: {formatCurrency(paymentRates.perRow)}</p>
            </div>

            {/* Per Translation Rate */}
            <div className="space-y-2">
              <Label htmlFor="perTranslationRate">Payment Per Translation (₦)</Label>
              <Input
                id="perTranslationRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.perTranslation.toString()}
                {...register("perTranslationRate")}
              />
              {errors.perTranslationRate && (
                <p className="text-sm text-destructive">{errors.perTranslationRate.message}</p>
              )}
              <p className="text-sm text-muted-foreground">Current: {formatCurrency(paymentRates.perTranslation)}</p>
            </div>

            {/* Bonus Threshold */}
            <div className="space-y-2">
              <Label htmlFor="bonusThreshold">Bonus Threshold (Rows)</Label>
              <Input
                id="bonusThreshold"
                type="number"
                min="0"
                step="1"
                placeholder={defaultRates.bonusThreshold?.toString()}
                {...register("bonusThreshold")}
              />
              {errors.bonusThreshold && <p className="text-sm text-destructive">{errors.bonusThreshold.message}</p>}
              <p className="text-sm text-muted-foreground">
                Current: {paymentRates.bonusThreshold} rows for bonus eligibility
              </p>
            </div>

            {/* Bonus Rate */}
            <div className="space-y-2">
              <Label htmlFor="bonusRate">Bonus Percentage</Label>
              <Input
                id="bonusRate"
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder={defaultRates.bonusRate?.toString()}
                {...register("bonusRate")}
              />
              {errors.bonusRate && <p className="text-sm text-destructive">{errors.bonusRate.message}</p>}
              <p className="text-sm text-muted-foreground">
                Current: {((paymentRates.bonusRate || 0) * 100).toFixed(0)}% bonus (e.g., 0.1 = 10%)
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="text-sm space-y-1">
              <p>Per Row: {formatCurrency(parseFloat(watchedValues.perRowRate) || defaultRates.perRow)}</p>
              <p>
                Per Translation:{" "}
                {formatCurrency(parseFloat(watchedValues.perTranslationRate) || defaultRates.perTranslation)}
              </p>
              <p>
                Bonus after {parseInt(watchedValues.bonusThreshold) || defaultRates.bonusThreshold} rows:{" "}
                {((parseFloat(watchedValues.bonusRate) || defaultRates.bonusRate!) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={!isDirty} isLoading={updating}>
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || updating}>
              Reset
            </Button>
          </div>

          {updating && (
            <div className="text-sm text-muted-foreground text-center">
              Updating Google Sheets configuration. This may take up to 10 seconds...
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
