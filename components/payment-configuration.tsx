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
  annotationRate: z
    .string()
    .min(1, "Annotation rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Annotation rate must be a positive number",
    }),
  translationRegularRate: z
    .string()
    .min(1, "Translation regular rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Translation regular rate must be a positive number",
    }),
  translationDualRate: z
    .string()
    .min(1, "Translation dual rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Translation dual rate must be a positive number",
    }),
  qaRate: z
    .string()
    .min(1, "QA rate is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "QA rate must be a positive number",
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
      annotationRate: "",
      translationRegularRate: "",
      translationDualRate: "",
      qaRate: "",
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
        annotationRate: paymentConfig.annotationRate,
        translationRegularRate: paymentConfig.translationRegularRate,
        translationDualRate: paymentConfig.translationDualRate,
        qaRate: paymentConfig.qaRate,
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
      annotationRate: paymentConfig?.annotationRate || "",
      translationRegularRate: paymentConfig?.translationRegularRate || "",
      translationDualRate: paymentConfig?.translationDualRate || "",
      qaRate: paymentConfig?.qaRate || "",
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
            {/* Annotation Rate */}
            <div className="space-y-2">
              <Label htmlFor="annotationRate">Payment Per Annotation (₦)</Label>
              <Input
                id="annotationRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.annotation.toString()}
                {...register("annotationRate")}
              />
              {errors.annotationRate && <p className="text-sm text-destructive">{errors.annotationRate.message}</p>}
              <p className="text-sm text-muted-foreground">Current: {formatCurrency(paymentRates.annotation)}</p>
            </div>

            {/* Translation Regular Rate */}
            <div className="space-y-2">
              <Label htmlFor="translationRegularRate">Translation Rate - Regular (₦)</Label>
              <Input
                id="translationRegularRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.translationRegular.toString()}
                {...register("translationRegularRate")}
              />
              {errors.translationRegularRate && (
                <p className="text-sm text-destructive">{errors.translationRegularRate.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Current: {formatCurrency(paymentRates.translationRegular)}
              </p>
            </div>

            {/* Translation Dual Rate */}
            <div className="space-y-2">
              <Label htmlFor="translationDualRate">Translation Rate - Dual (₦)</Label>
              <Input
                id="translationDualRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.translationDual.toString()}
                {...register("translationDualRate")}
              />
              {errors.translationDualRate && (
                <p className="text-sm text-destructive">{errors.translationDualRate.message}</p>
              )}
              <p className="text-sm text-muted-foreground">Current: {formatCurrency(paymentRates.translationDual)}</p>
            </div>

            {/* QA Rate */}
            <div className="space-y-2">
              <Label htmlFor="qaRate">QA Review Rate (₦)</Label>
              <Input
                id="qaRate"
                type="number"
                min="0"
                step="0.01"
                placeholder={defaultRates.qa.toString()}
                {...register("qaRate")}
              />
              {errors.qaRate && <p className="text-sm text-destructive">{errors.qaRate.message}</p>}
              <p className="text-sm text-muted-foreground">Current: {formatCurrency(paymentRates.qa)}</p>
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
              <p>
                Per Annotation: {formatCurrency(parseFloat(watchedValues.annotationRate) || defaultRates.annotation)}
              </p>
              <p>
                Translation Regular:{" "}
                {formatCurrency(parseFloat(watchedValues.translationRegularRate) || defaultRates.translationRegular)}
              </p>
              <p>
                Translation Dual:{" "}
                {formatCurrency(parseFloat(watchedValues.translationDualRate) || defaultRates.translationDual)}
              </p>
              <p>QA Rate: {formatCurrency(parseFloat(watchedValues.qaRate) || defaultRates.qa)}</p>
              <p>
                Bonus after {parseInt(watchedValues.bonusThreshold) || defaultRates.bonusThreshold} annotations:{" "}
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
