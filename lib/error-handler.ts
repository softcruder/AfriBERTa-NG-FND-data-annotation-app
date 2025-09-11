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
    if (error instanceof Error) {
      // Check if it's a fetch error
      if (error.message.includes("fetch")) {
        return this.createError("Network error. Please check your connection and try again.", "NETWORK_ERROR", 0)
      }

      // Check if it's a JSON parsing error
      if (error.message.includes("JSON")) {
        return this.createError("Invalid response from server. Please try again.", "PARSE_ERROR", 0)
      }

      return this.createError(error.message, "UNKNOWN_ERROR")
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
    console.error("[v0] Error:", error, context)

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error, { extra: context })
    }
  }
}
