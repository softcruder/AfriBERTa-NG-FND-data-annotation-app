import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format money consistently across server and client.
 * Takes a currency string (symbol like "₦" or code like "NGN"), an amount, and options.
 * Defaults are stable (fixed locale/timezone) to avoid hydration mismatches.
 */
export function formatMoney(
  currency: string = "NGN",
  amount: number,
  options?: {
    type?: "decimal" | "currency" | "compact"
    maximumFractionDigits?: number
    minimumFractionDigits?: number
    locale?: string
  },
): string {
  const upper = (currency || "").toUpperCase()
  const isCode = /^[A-Z]{3}$/.test(upper)
  const locale = options?.locale ?? (upper === "NGN" || currency === "₦" ? "en-NG" : "en-GB")

  const nfBase: Intl.NumberFormatOptions = {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits,
  }

  let formatted: string
  if (options?.type === "currency" && isCode) {
    formatted = new Intl.NumberFormat(locale, { ...nfBase, style: "currency", currency: upper }).format(amount)
    return formatted
  }

  if (options?.type === "compact") {
    formatted = new Intl.NumberFormat(locale, { ...nfBase, notation: "compact" }).format(amount)
  } else {
    formatted = new Intl.NumberFormat(locale, nfBase).format(amount)
  }

  // Prefix with provided currency string for decimal/compact
  return `${currency}${formatted}`
}

/**
 * Format a date/time with stable locale/timezone defaults to prevent hydration drift.
 */
export function formatDate(
  input: string | number | Date,
  options?: { withTime?: boolean; timeZone?: string; locale?: string },
): string {
  try {
    const d = input instanceof Date ? input : new Date(input)
    const locale = options?.locale ?? "en-GB"
    const timeZone = options?.timeZone ?? "UTC"
    const fmt = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      ...(options?.withTime ? { timeStyle: "short" as const } : {}),
      timeZone,
    })
    return fmt.format(d)
  } catch {
    return String(input)
  }
}
