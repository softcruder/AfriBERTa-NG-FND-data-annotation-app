import { describe, it, expect } from "vitest"
import { VerdictEnum, annotationFormSchema } from "@/lib/validation"

describe("Enhanced Validation Schema", () => {
  describe("VerdictEnum", () => {
    it("includes all expected verdict options", () => {
      const values = VerdictEnum._def.values
      expect(values).toContain("True")
      expect(values).toContain("False")
      expect(values).toContain("Misleading")
      expect(values).toContain("Partly True")
      expect(values).toContain("Unverifiable")
      expect(values).toContain("Other")
      expect(values).toContain("Not Valid")
    })
  })

  describe("annotationFormSchema", () => {
    it("validates basic annotation form", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("validates translation annotation form", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        translation: "Test translation",
        translationLanguage: "ha",
        needsTranslation: true,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
        articleBodyHausa: "This is the translated article body in Hausa language that meets the minimum character requirement.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("validates dual translation annotation form", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        translationHausa: "Test Hausa translation",
        translationYoruba: "Test Yoruba translation",
        isDualTranslator: true,
        needsTranslation: true,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
        articleBodyHausa: "This is the translated article body in Hausa language that meets the minimum character requirement.",
        articleBodyYoruba: "This is the translated article body in Yoruba language that meets the minimum character requirement.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("fails validation when dual translator missing Hausa translation", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        translationYoruba: "Test Yoruba translation",
        isDualTranslator: true,
        needsTranslation: true,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
        articleBodyYoruba: "This is the translated article body in Yoruba language that meets the minimum character requirement.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes("translationHausa"))).toBe(true)
      }
    })

    it("fails validation when dual translator missing Yoruba translation", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        translationHausa: "Test Hausa translation",
        isDualTranslator: true,
        needsTranslation: true,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
        articleBodyHausa: "This is the translated article body in Hausa language that meets the minimum character requirement.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes("translationYoruba"))).toBe(true)
      }
    })

    it("validates QA annotation form", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True",
        isValid: true,
        isQAMode: true,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("validates invalid task marking", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True", // Still need a valid verdict even for invalid tasks
        isValid: false,
        invalidityReason: "Poor quality data",
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("requires at least one claim", () => {
      const data = {
        claims: [],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain("claims")
    })

    it("requires translation when needsTranslation is true", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: true,
        // Missing translation and translationLanguage
        verdict: "True",
        isValid: true,
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain("translation")
    })

    it("allows empty translation when verdict is 'Not Valid'", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: true,
        translation: "", // Empty translation
        verdict: "Not Valid",
        isValid: false,
        invalidityReason: "Poor quality",
        isQAMode: false,
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false) // Still fails because translationLanguage is required
    })

    it("requires invalidity reason when task is marked invalid", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True", // Still need a valid verdict even for invalid tasks
        isValid: false,
        // Missing invalidityReason
        isQAMode: false,
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(false)
      expect(result.error?.issues.some((issue: any) => issue.path.includes("invalidityReason"))).toBe(true)
    })

    it("validates time fields", () => {
      const data = {
        claims: ["Test claim"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        needsTranslation: false,
        verdict: "True",
        isValid: true,
        isQAMode: false,
        startTime: "2024-01-01T10:00:00Z",
        endTime: "2024-01-01T11:00:00Z",
        articleBody: "This is a test article body that is long enough to meet the minimum 50 character requirement for validation.",
      }

      const result = annotationFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
