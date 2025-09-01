import { formatMoney } from "@/lib/utils"
import type { AppConfig } from "@/lib/google-apis"

// Payment configuration keys in AppConfig
export const PAYMENT_CONFIG_KEYS = {
  PER_ROW_RATE: "payment_per_row_rate",
  PER_TRANSLATION_RATE: "payment_per_translation_rate",
  BONUS_THRESHOLD: "payment_bonus_threshold",
  BONUS_RATE: "payment_bonus_rate",
} as const

// Payment calculation utilities
export interface PaymentRates {
  perRow: number // ₦100 per row
  perTranslation: number // ₦150 per translation
  bonusThreshold?: number // rows threshold for bonus
  bonusRate?: number // bonus percentage
}

export interface PaymentConfig {
  perRowRate: string
  perTranslationRate: string
  bonusThreshold: string
  bonusRate: string
}

export interface PaymentCalculation {
  totalRows: number
  translations: number
  totalHours: number
  avgRowsPerHour: number
  basePayment: number
  translationPayment: number
  bonusPayment: number
  totalPayment: number
  breakdown: {
    rowPayment: number
    translationPayment: number
    bonus: number
  }
}

export const DEFAULT_RATES: PaymentRates = {
  perRow: 100, // ₦100 per completed row
  perTranslation: 150, // ₦150 per translation
  bonusThreshold: 50, // bonus after 50 rows
  bonusRate: 0.1, // 10% bonus
}

/**
 * Parse payment rates from AppConfig, falling back to defaults
 */
export function parsePaymentRatesFromConfig(config: AppConfig | undefined): PaymentRates {
  if (!config) return DEFAULT_RATES

  return {
    perRow: parseFloat(config[PAYMENT_CONFIG_KEYS.PER_ROW_RATE]) || DEFAULT_RATES.perRow,
    perTranslation: parseFloat(config[PAYMENT_CONFIG_KEYS.PER_TRANSLATION_RATE]) || DEFAULT_RATES.perTranslation,
    bonusThreshold: parseInt(config[PAYMENT_CONFIG_KEYS.BONUS_THRESHOLD]) || DEFAULT_RATES.bonusThreshold,
    bonusRate: parseFloat(config[PAYMENT_CONFIG_KEYS.BONUS_RATE]) || DEFAULT_RATES.bonusRate,
  }
}

/**
 * Convert PaymentRates to AppConfig format
 */
export function paymentRatesToConfig(rates: PaymentRates): PaymentConfig {
  return {
    perRowRate: rates.perRow.toString(),
    perTranslationRate: rates.perTranslation.toString(),
    bonusThreshold: (rates.bonusThreshold || DEFAULT_RATES.bonusThreshold!).toString(),
    bonusRate: (rates.bonusRate || DEFAULT_RATES.bonusRate!).toString(),
  }
}

/**
 * Convert PaymentConfig to AppConfig entries
 */
export function paymentConfigToAppConfig(config: PaymentConfig): Record<string, string> {
  return {
    [PAYMENT_CONFIG_KEYS.PER_ROW_RATE]: config.perRowRate,
    [PAYMENT_CONFIG_KEYS.PER_TRANSLATION_RATE]: config.perTranslationRate,
    [PAYMENT_CONFIG_KEYS.BONUS_THRESHOLD]: config.bonusThreshold,
    [PAYMENT_CONFIG_KEYS.BONUS_RATE]: config.bonusRate,
  }
}

export function calculatePayment(
  totalRows: number,
  translations: number,
  totalHours: number,
  rates: PaymentRates = DEFAULT_RATES,
): PaymentCalculation {
  const basePayment = totalRows * rates.perRow
  const translationPayment = translations * rates.perTranslation

  // Calculate bonus if threshold is met
  let bonusPayment = 0
  if (rates.bonusThreshold && rates.bonusRate && totalRows >= rates.bonusThreshold) {
    bonusPayment = basePayment * rates.bonusRate
  }

  const totalPayment = basePayment + translationPayment + bonusPayment
  const avgRowsPerHour = totalHours > 0 ? totalRows / totalHours : 0

  return {
    totalRows,
    translations,
    totalHours,
    avgRowsPerHour,
    basePayment,
    translationPayment,
    bonusPayment,
    totalPayment,
    breakdown: {
      rowPayment: basePayment,
      translationPayment,
      bonus: bonusPayment,
    },
  }
}

export function formatCurrency(amount: number, currency = "₦"): string {
  return formatMoney(currency, amount)
}

export function calculateEfficiencyMetrics(totalRows: number, totalHours: number, targetRowsPerHour = 5) {
  const avgRowsPerHour = totalHours > 0 ? totalRows / totalHours : 0
  const efficiency = (avgRowsPerHour / targetRowsPerHour) * 100

  let status: "excellent" | "good" | "average" | "below-average" | "not-started"
  let recommendation: string

  if (efficiency >= 120) {
    status = "excellent"
    recommendation = "Outstanding performance! Consider taking on more complex tasks."
  } else if (efficiency >= 100) {
    status = "good"
    recommendation = "Great work! You're meeting performance targets."
  } else if (efficiency >= 80) {
    status = "average"
    recommendation = "Good progress. Focus on accuracy while maintaining pace."
  } else if (efficiency > 1 && efficiency < 80) {
    status = "below-average"
    recommendation = "Take your time to ensure quality. Speed will improve with practice."
  } else {
    status = "not-started"
    recommendation = "Start annotating to measure performance."
  }

  return { efficiency, status, recommendation }
}

// Session timeout utilities
export const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes in milliseconds

export function isSessionExpired(lastActivity: Date): boolean {
  return Date.now() - lastActivity.getTime() > SESSION_TIMEOUT
}

export function getTimeUntilTimeout(lastActivity: Date): number {
  const elapsed = Date.now() - lastActivity.getTime()
  return Math.max(0, SESSION_TIMEOUT - elapsed)
}

export function formatTimeRemaining(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
