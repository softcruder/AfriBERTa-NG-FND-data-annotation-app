export interface AppError {
  message: string
  code?: string
  statusCode?: number
  context?: Record<string, any>
}

export class AppErrorHandler {
  static createError(message: string, code?: string, statusCode?: number, context?: Record<string, any>): AppError {
    return {
      message,
      code,
      statusCode,
      context,
    }
  }

  static handleApiError(error: unknown): AppError {
    // Axios-style error with response payload
    const anyErr = error as any
    const resp = anyErr?.response
    const data = resp?.data
    if (resp) {
      const status = Number(resp.status) || undefined
      // Shape: { error: string, details?: any, issues?: any }
      const srvError = typeof data?.error === "string" ? data.error : undefined
      const srvDetails = data?.details ?? data?.issues ?? data?.message
      let message = srvError || `Request failed with status ${status ?? "unknown"}`

      // Append details in a human-friendly way
      if (srvDetails) {
        if (typeof srvDetails === "string") {
          message = `${message}: ${srvDetails}`
        } else if (Array.isArray(srvDetails)) {
          const compact = srvDetails.map(d => (typeof d === "string" ? d : JSON.stringify(d))).join("; ")
          message = `${message}: ${compact}`
        } else if (typeof srvDetails === "object") {
          // Special case: zod formatted issues
          if (srvDetails?.formErrors || srvDetails?._errors) {
            message = `${message}: validation failed`
          } else if (srvDetails?.message) {
            message = `${message}: ${srvDetails.message}`
          } else {
            message = `${message}: ${JSON.stringify(srvDetails)}`
          }
        }
      }

      const code = `HTTP_${status ?? "UNKNOWN"}`
      return this.createError(message, code, status, { response: { status, data }, url: resp?.config?.url })
    }

    // Fetch/SWR thrown Error with attached details
    if (anyErr && anyErr.details) {
      const status = Number(anyErr.status) || undefined
      const details = anyErr.details
      const srvError = typeof details?.error === "string" ? details.error : undefined
      const srvDetails = details?.details ?? details?.issues ?? details?.message
      let message = srvError || anyErr.message || `Request failed${status ? ` with status ${status}` : ""}`
      if (srvDetails) {
        if (typeof srvDetails === "string") message = `${message}: ${srvDetails}`
        else message = `${message}: ${JSON.stringify(srvDetails)}`
      }
      return this.createError(message, status ? `HTTP_${status}` : "FETCH_ERROR", status, { details })
    }

    if (error instanceof Error) {
      const msg = error.message || "Unknown error"
      // Check if it's a network/fetch related error by message hint
      if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        return this.createError("Network error. Please check your connection and try again.", "NETWORK_ERROR", 0)
      }
      if (msg.includes("JSON")) {
        return this.createError("Invalid response from server. Please try again.", "PARSE_ERROR", 0)
      }
      return this.createError(msg, "UNKNOWN_ERROR")
    }

    if (typeof error === "string") {
      return this.createError(error, "STRING_ERROR")
    }

    return this.createError("An unexpected error occurred. Please try again.", "UNKNOWN_ERROR")
  }

  static getErrorMessage(error: unknown): string {
    const appError = this.handleApiError(error)
    return appError.message
  }

  static logError(error: unknown, context?: Record<string, any>) {
    console.error("Error:", error, context)

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { extra: context })
    }
  }
}
