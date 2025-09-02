import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TranslationAnnotationForm } from "@/components/forms/translation-annotation-form"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"

// Create a shared mock form context
let mockFormContext = {
  watch: () => ({
    claims: ["Original claim text"],
    sourceUrl: "https://example.com",
    claimLinks: [],
    translation: "",
    translationHausa: "",
    translationYoruba: "",
    isDualTranslator: false,
    verdict: undefined,
    translationLanguage: "hausa",
    articleBody: "",
    articleBodyHausa: "",
    articleBodyYoruba: "",
    isValid: true,
    invalidityReason: "",
    needsTranslation: true,
  }),
  setValue: vi.fn(),
  getValues: vi.fn(() => ({
    claimLinks: [],
  })),
  formState: { errors: {} },
}

// Mock the useFormContext hook
vi.mock("react-hook-form", () => ({
  useFormContext: () => mockFormContext,
}))

// Mock the base annotation form
vi.mock("@/components/forms/base-annotation-form", () => ({
  BaseAnnotationForm: ({ children, task, user, onComplete, onCancel, mode }: any) => {
    return (
      <div data-testid="base-form">
        <div>Mode: {mode}</div>
        <div>User: {user.name}</div>
        <div>Task: {task.id}</div>
        <div>Is Dual: {user.translationLanguages?.length > 1 ? "Yes" : "No"}</div>
        <div data-testid="form-provider">
          {children}
        </div>
        <button onClick={() => onComplete?.(task)} data-testid="submit-button">
          Submit
        </button>
        <button onClick={() => onCancel?.()} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    )
  },
}))

// Test data
const mockTask: AnnotationTask = {
  id: "test-task-1",
  rowId: "row-1",
  csvRow: {
    id: "row-1",
    originalIndex: 0,
    data: [
      "1", // Index
      "Test claim text", // Claim
      "Test context", // Context
      "Test category", // Category
      "Test subcategory", // Subcategory
      "Test language", // Language
      "Test article body", // Article body
      "https://example.com", // Source URL
      "2024-01-01", // Date
      "Test author", // Author
    ],
  },
  status: "not-started",
  claims: ["Test claim text"],
  sourceLinks: ["https://example.com"],
}

const mockSingleTranslatorUser: User = {
  id: "user-1",
  name: "Single Translator",
  email: "single@example.com",
  role: "annotator",
  translationLanguages: ["hausa"],
}

const mockDualTranslatorUser: User = {
  id: "user-2",
  name: "Dual Translator",
  email: "dual@example.com",
  role: "annotator",
  translationLanguages: ["hausa", "yoruba"],
}

describe("TranslationAnnotationForm Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Single Translator Interface", () => {
    it("renders single language translation interface correctly", () => {
      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockSingleTranslatorUser}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Should show the original claim
      expect(screen.getByDisplayValue("Original claim text")).toBeInTheDocument()

      // Should show translation interface
      expect(screen.getByText("Target Language")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Enter translated claim text...")).toBeInTheDocument()
    })

    it("allows single translator to complete task", async () => {
      const onComplete = vi.fn()
      const user = userEvent.setup()

      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockSingleTranslatorUser}
          onComplete={onComplete}
          onCancel={vi.fn()}
        />
      )

      // Submit form
      const submitButton = screen.getByTestId("submit-button")
      await user.click(submitButton)

      expect(onComplete).toHaveBeenCalledWith(mockTask)
    })
  })

  describe("Dual Translator Interface", () => {
    beforeEach(() => {
      // Update mock to return isDualTranslator: true
      mockFormContext.watch = () => ({
        claims: ["Original claim text"],
        sourceUrl: "https://example.com",
        claimLinks: [],
        translation: "",
        translationHausa: "",
        translationYoruba: "",
        isDualTranslator: true,
        verdict: undefined,
        translationLanguage: "hausa",
        articleBody: "",
        articleBodyHausa: "",
        articleBodyYoruba: "",
        isValid: true,
        invalidityReason: "",
        needsTranslation: true,
      })
    })

    it("renders dual language translation interface correctly", () => {
      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockDualTranslatorUser}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Should show the original claim
      expect(screen.getByDisplayValue("Original claim text")).toBeInTheDocument()

      // Should show dual translation message and fields
      expect(screen.getByText("Translations (Both Languages Required)")).toBeInTheDocument()
      expect(screen.getByText("As a dual translator, please provide translations for both Hausa and Yoruba.")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Enter Hausa translation of the claim...")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Enter Yoruba translation of the claim...")).toBeInTheDocument()
    })

    it("allows dual translator to complete task", async () => {
      const onComplete = vi.fn()
      const user = userEvent.setup()

      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockDualTranslatorUser}
          onComplete={onComplete}
          onCancel={vi.fn()}
        />
      )

      // Submit form
      const submitButton = screen.getByTestId("submit-button")
      await user.click(submitButton)

      expect(onComplete).toHaveBeenCalledWith(mockTask)
    })
  })

  describe("Common Features", () => {
    it("shows original claim in readonly state", () => {
      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockSingleTranslatorUser}
          onComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const claimField = screen.getByDisplayValue("Original claim text")
      expect(claimField).toBeDisabled()
    })

    it("handles cancel action", async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()

      render(
        <TranslationAnnotationForm
          task={mockTask}
          user={mockSingleTranslatorUser}
          onComplete={vi.fn()}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByTestId("cancel-button")
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })
  })
})
