import { formatMoney } from "@/lib/utils"
import type { AppConfig } from "@/lib/google-apis"

// Payment configuration keys in AppConfig
export const PAYMENT_CONFIG_KEYS = {
  ANNOTATION_RATE: "payment_annotation_rate", // NGN100 for annotation
  TRANSLATION_REGULAR_RATE: "payment_translation_regular_rate", // NGN80 for regular translator
  TRANSLATION_DUAL_RATE: "payment_translation_dual_rate", // NGN70 for dual translator
  QA_RATE: "payment_qa_rate", // NGN20 for QA
  BONUS_THRESHOLD: "payment_bonus_threshold",
  BONUS_RATE: "payment_bonus_rate",
} as const

// Payment calculation utilities
export interface PaymentRates {
  annotation: number // ₦100 per annotation
  translationRegular: number // ₦70 per translation (regular translator)
  translationDual: number // ₦80 per translation (dual translator)
  qa: number // ₦20 per QA
  bonusThreshold?: number // rows threshold for bonus
  bonusRate?: number // bonus percentage
}

export interface PaymentConfig {
  annotationRate: string
  translationRegularRate: string
  translationDualRate: string
  qaRate: string
  bonusThreshold: string
  bonusRate: string
}

export interface PaymentCalculation {
  totalAnnotations: number
  totalTranslations: number
  totalQA: number
  totalHours: number
  avgAnnotationsPerHour: number
  annotationPayment: number
  translationPayment: number
  qaPayment: number
  bonusPayment: number
  totalPayment: number
  breakdown: {
    annotationPayment: number
    translationPayment: number
    qaPayment: number
    bonus: number
  }
}

export const DEFAULT_RATES: PaymentRates = {
  annotation: 100, // ₦100 per annotation
  translationRegular: 70, // ₦80 per translation (regular translator)
  translationDual: 80, // ₦70 per translation (dual translator)
  qa: 20, // ₦20 per QA
  bonusThreshold: 50, // bonus after 50 annotations
  bonusRate: 0.1, // 10% bonus
}

/**
 * Parse payment rates from AppConfig, falling back to defaults
 */
export function parsePaymentRatesFromConfig(config: AppConfig | undefined): PaymentRates {
  if (!config) return DEFAULT_RATES

  return {
    annotation: parseFloat(config[PAYMENT_CONFIG_KEYS.ANNOTATION_RATE]) || DEFAULT_RATES.annotation,
    translationRegular:
      parseFloat(config[PAYMENT_CONFIG_KEYS.TRANSLATION_REGULAR_RATE]) || DEFAULT_RATES.translationRegular,
    translationDual: parseFloat(config[PAYMENT_CONFIG_KEYS.TRANSLATION_DUAL_RATE]) || DEFAULT_RATES.translationDual,
    qa: parseFloat(config[PAYMENT_CONFIG_KEYS.QA_RATE]) || DEFAULT_RATES.qa,
    bonusThreshold: parseInt(config[PAYMENT_CONFIG_KEYS.BONUS_THRESHOLD]) || DEFAULT_RATES.bonusThreshold,
    bonusRate: parseFloat(config[PAYMENT_CONFIG_KEYS.BONUS_RATE]) || DEFAULT_RATES.bonusRate,
  }
}

/**
 * Convert PaymentRates to AppConfig format
 */
export function paymentRatesToConfig(rates: PaymentRates): PaymentConfig {
  return {
    annotationRate: rates.annotation.toString(),
    translationRegularRate: rates.translationRegular.toString(),
    translationDualRate: rates.translationDual.toString(),
    qaRate: rates.qa.toString(),
    bonusThreshold: (rates.bonusThreshold || DEFAULT_RATES.bonusThreshold!).toString(),
    bonusRate: (rates.bonusRate || DEFAULT_RATES.bonusRate!).toString(),
  }
}

/**
 * Convert PaymentConfig to AppConfig entries
 */
export function paymentConfigToAppConfig(config: PaymentConfig): Record<string, string> {
  return {
    [PAYMENT_CONFIG_KEYS.ANNOTATION_RATE]: config.annotationRate,
    [PAYMENT_CONFIG_KEYS.TRANSLATION_REGULAR_RATE]: config.translationRegularRate,
    [PAYMENT_CONFIG_KEYS.TRANSLATION_DUAL_RATE]: config.translationDualRate,
    [PAYMENT_CONFIG_KEYS.QA_RATE]: config.qaRate,
    [PAYMENT_CONFIG_KEYS.BONUS_THRESHOLD]: config.bonusThreshold,
    [PAYMENT_CONFIG_KEYS.BONUS_RATE]: config.bonusRate,
  }
}

/**
 * Check if a user is a dual translator based on their language preferences
 * Dual translator = can translate to multiple languages (has comma in translationLanguages)
 */
export function isDualTranslator(translationLanguages?: string): boolean {
  if (!translationLanguages) return false
  const languages = translationLanguages.split(',').map(lang => lang.trim()).filter(lang => lang.length > 0)
  return languages.length > 1
}

export function calculatePayment(
  totalAnnotations: number,
  totalTranslations: number,
  totalQA: number,
  totalHours: number,
  rates: PaymentRates = DEFAULT_RATES,
  userTranslationLanguages?: string,
): PaymentCalculation {
  const annotationPayment = totalAnnotations * rates.annotation
  const translationRate = isDualTranslator(userTranslationLanguages) ? rates.translationDual : rates.translationRegular
  const translationPayment = totalTranslations * translationRate
  const qaPayment = totalQA * rates.qa

  // Calculate bonus if threshold is met (based on total annotations)
  let bonusPayment = 0
  if (rates.bonusThreshold && rates.bonusRate && totalAnnotations >= rates.bonusThreshold) {
    bonusPayment = annotationPayment * rates.bonusRate
  }

  const totalPayment = annotationPayment + translationPayment + qaPayment + bonusPayment
  const avgAnnotationsPerHour = totalHours > 0 ? totalAnnotations / totalHours : 0

  return {
    totalAnnotations,
    totalTranslations,
    totalQA,
    totalHours,
    avgAnnotationsPerHour,
    annotationPayment,
    translationPayment,
    qaPayment,
    bonusPayment,
    totalPayment,
    breakdown: {
      annotationPayment,
      translationPayment,
      qaPayment,
      bonus: bonusPayment,
    },
  }
}

export function formatCurrency(amount: number, currency = "₦"): string {
  return formatMoney(currency, amount)
}

export function calculateEfficiencyMetrics(totalAnnotations: number, totalHours: number, targetAnnotationsPerHour = 5) {
  const avgAnnotationsPerHour = totalHours > 0 ? totalAnnotations / totalHours : 0
  const efficiency = (avgAnnotationsPerHour / targetAnnotationsPerHour) * 100

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
