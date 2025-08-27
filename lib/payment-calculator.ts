// Payment calculation utilities
export interface PaymentRates {
  perRow: number // ₦100 per row
  perTranslation: number // ₦150 per translation
  bonusThreshold?: number // rows threshold for bonus
  bonusRate?: number // bonus percentage
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
  return `${currency}${amount.toLocaleString()}`
}

export function calculateEfficiencyMetrics(
  totalRows: number,
  totalHours: number,
  targetRowsPerHour = 5,
): {
  efficiency: number // percentage
  status: "excellent" | "good" | "average" | "below-average"
  recommendation: string
} {
  const avgRowsPerHour = totalHours > 0 ? totalRows / totalHours : 0
  const efficiency = (avgRowsPerHour / targetRowsPerHour) * 100

  let status: "excellent" | "good" | "average" | "below-average"
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
  } else {
    status = "below-average"
    recommendation = "Take your time to ensure quality. Speed will improve with practice."
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
