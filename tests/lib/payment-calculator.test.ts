import { describe, it, expect } from "vitest"
import { calculatePayment, isDualTranslator, calculateEfficiencyMetrics } from "@/lib/payment-calculator"

describe("Payment Calculator", () => {
  describe("isDualTranslator", () => {
    it("should return true for users with multiple translation languages", () => {
      expect(isDualTranslator("ha,yo")).toBe(true)
    })

    it("should return false for users with single translation language", () => {
      expect(isDualTranslator("ha")).toBe(false)
    })

    it("should return false for users with no translation languages", () => {
      expect(isDualTranslator("")).toBe(false)
      expect(isDualTranslator(undefined)).toBe(false)
    })

    it("should handle empty strings and whitespace", () => {
      expect(isDualTranslator("   ")).toBe(false)
      expect(isDualTranslator("ha, , yo")).toBe(true) // empty language filtered out
    })
  })

  describe("calculatePayment", () => {
    const defaultRates = {
      annotation: 100,
      translationRegular: 70,
      translationDual: 80,
      qa: 20,
      bonusThreshold: 50,
      bonusRate: 0.1,
    }

    it("should calculate payment for annotations only", () => {
      const payment = calculatePayment(10, 0, 0, 5, defaultRates)

      expect(payment.totalAnnotations).toBe(10)
      expect(payment.totalTranslations).toBe(0)
      expect(payment.totalQA).toBe(0)
      expect(payment.annotationPayment).toBe(1000)
      expect(payment.translationPayment).toBe(0)
      expect(payment.qaPayment).toBe(0)
      expect(payment.totalPayment).toBe(1000)
    })

    it("should calculate payment for translations with regular translator", () => {
      const payment = calculatePayment(0, 5, 0, 2, defaultRates, "ha")

      expect(payment.totalTranslations).toBe(5)
      expect(payment.translationPayment).toBe(350) // 5 * 70
      expect(payment.totalPayment).toBe(350)
    })

    it("should calculate payment for translations with dual translator", () => {
      const payment = calculatePayment(0, 5, 0, 2, defaultRates, "ha,yo")

      expect(payment.totalTranslations).toBe(5)
      expect(payment.translationPayment).toBe(400) // 5 * 80
      expect(payment.totalPayment).toBe(400)
    })

    it("should calculate payment for QA tasks", () => {
      const payment = calculatePayment(0, 0, 10, 3, defaultRates)

      expect(payment.totalQA).toBe(10)
      expect(payment.qaPayment).toBe(200) // 10 * 20
      expect(payment.totalPayment).toBe(200)
    })

    it("should calculate bonus when threshold is met", () => {
      const payment = calculatePayment(60, 0, 0, 10, defaultRates)

      expect(payment.annotationPayment).toBe(6000) // 60 * 100
      expect(payment.bonusPayment).toBe(600) // 6000 * 0.1
      expect(payment.totalPayment).toBe(6600)
    })

    it("should not calculate bonus when threshold is not met", () => {
      const payment = calculatePayment(40, 0, 0, 8, defaultRates)

      expect(payment.annotationPayment).toBe(4000)
      expect(payment.bonusPayment).toBe(0)
      expect(payment.totalPayment).toBe(4000)
    })

    it("should calculate combined payment types", () => {
      const payment = calculatePayment(30, 10, 5, 15, defaultRates, "ha,yo")

      expect(payment.annotationPayment).toBe(3000) // 30 * 100
      expect(payment.translationPayment).toBe(800) // 10 * 80 (dual translator)
      expect(payment.qaPayment).toBe(100) // 5 * 20
      expect(payment.bonusPayment).toBe(0) // below threshold
      expect(payment.totalPayment).toBe(3900)
    })

    it("should calculate efficiency metrics separately", () => {
      const payment = calculatePayment(50, 0, 0, 10, defaultRates)
      const efficiency = calculateEfficiencyMetrics(payment.totalAnnotations, payment.totalHours)

      expect(payment.avgAnnotationsPerHour).toBe(5)
      expect(efficiency.efficiency).toBe(100)
      expect(efficiency.status).toBe("good")
    })

    it("should handle zero hours gracefully in payment calculation", () => {
      const payment = calculatePayment(10, 0, 0, 0, defaultRates)
      const efficiency = calculateEfficiencyMetrics(payment.totalAnnotations, payment.totalHours)

      expect(payment.avgAnnotationsPerHour).toBe(0)
      expect(efficiency.efficiency).toBe(0)
      expect(efficiency.status).toBe("not-started")
    })
  })
})
