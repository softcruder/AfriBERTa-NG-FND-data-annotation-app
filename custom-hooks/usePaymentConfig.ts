import useSWR from "swr"
import { useCallback, useMemo } from "react"
import { useRequest } from "@/hooks/useRequest"
import type { AppConfig } from "@/lib/google-apis"
import {
  PaymentRates,
  PaymentConfig,
  parsePaymentRatesFromConfig,
  paymentRatesToConfig,
  paymentConfigToAppConfig,
  DEFAULT_RATES,
} from "@/lib/payment-calculator"

const PAYMENT_CONFIG_KEY = "/api/config"

export function usePaymentConfig() {
  const { data, error, isLoading, mutate } = useSWR<{ config: AppConfig }>(PAYMENT_CONFIG_KEY, async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Failed to fetch payment config")
    }
    return response.json()
  })

  const { request, loading: updating } = useRequest()

  const paymentRates: PaymentRates = useMemo(() => parsePaymentRatesFromConfig(data?.config), [data?.config])
  const paymentConfig: PaymentConfig = useMemo(() => paymentRatesToConfig(paymentRates), [paymentRates])

  const updatePaymentConfig = useCallback(
    async (newConfig: PaymentConfig) => {
      try {
        console.log("Starting payment config update...")
        const configEntries = paymentConfigToAppConfig(newConfig)
        console.log("Config entries prepared:", configEntries)

        // Add a timeout to prevent hanging requests
        const requestPromise = request.post("/config", {
          entries: configEntries,
        })

        console.log("Making API request...")
        await Promise.race([
          requestPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout after 30 seconds")), 30000)),
        ])
        console.log("API request completed successfully")

        // Optimistically update the cache
        if (data) {
          const updatedConfig = { ...data.config, ...configEntries }
          mutate({ config: updatedConfig }, false)
        }

        return { success: true }
      } catch (error) {
        console.error("Failed to update payment config:", error)
        // Revert optimistic update on error
        mutate()
        throw error
      }
    },
    [request, data, mutate],
  )

  return {
    paymentRates,
    paymentConfig,
    defaultRates: DEFAULT_RATES,
    isLoading,
    error,
    updating,
    updatePaymentConfig,
    refetch: mutate,
  }
}
