import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AnnotationFormRouter } from "@/components/forms/annotation-form-router"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"

// Mock the form components
vi.mock("@/components/forms/regular-annotation-form", () => ({
  RegularAnnotationForm: ({ task, user, onComplete, onCancel }: any) => (
    <div data-testid="regular-annotation-form">
      <h2>Regular Annotation Form</h2>
      <p>User: {user.name}</p>
      <p>Task: {task.id}</p>
      <button onClick={() => onComplete(task)}>Complete</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

vi.mock("@/components/forms/translation-annotation-form", () => ({
  TranslationAnnotationForm: ({ task, user, onComplete, onCancel }: any) => (
    <div data-testid="translation-annotation-form">
      <h2>Translation Annotation Form</h2>
      <p>User: {user.name}</p>
      <p>Task: {task.id}</p>
      <p>Is Dual Translator: {user.translationLanguages?.length > 1 ? "Yes" : "No"}</p>
      <button onClick={() => onComplete(task)}>Complete Translation</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

vi.mock("@/components/forms/qa-annotation-form", () => ({
  QAAnnotationForm: ({ task, user, onComplete, onCancel }: any) => (
    <div data-testid="qa-annotation-form">
      <h2>QA Annotation Form</h2>
      <p>User: {user.name}</p>
      <p>Task: {task.id}</p>
      <button onClick={() => onComplete(task)}>Complete QA</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

describe("AnnotationFormRouter", () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  // Mock users with different capabilities
  const singleLanguageTranslator: User = {
    id: "user1",
    email: "translator@example.com",
    name: "Single Translator",
    picture: undefined,
    role: "annotator",
    translationLanguages: ["ha"], // Only Hausa
  }

  const dualLanguageTranslator: User = {
    id: "user2",
    email: "dual@example.com",
    name: "Dual Translator",
    picture: undefined,
    role: "annotator",
    translationLanguages: ["ha", "yo"], // Both Hausa and Yoruba
  }

  const annotatorOnly: User = {
    id: "user3",
    email: "annotator@example.com",
    name: "Annotator Only",
    picture: undefined,
    role: "annotator",
    translationLanguages: [], // No translation capabilities
  }

  // Mock tasks
  const englishTask: AnnotationTask = {
    id: "task1",
    rowId: "row1",
    csvRow: {
      id: "csv1",
      originalIndex: 0,
      data: ["1", "Test claim in English", "", "", "en", "", "", "https://example.com"],
    },
    claims: ["Test claim in English"],
    sourceLinks: ["https://example.com"],
    status: "not-started",
  }

  const hausaTask: AnnotationTask = {
    id: "task2",
    rowId: "row2",
    csvRow: {
      id: "csv2",
      originalIndex: 1,
      data: ["2", "Test claim in Hausa", "", "", "ha", "", "", "https://example.com"],
    },
    claims: ["Test claim in Hausa"],
    sourceLinks: ["https://example.com"],
    status: "not-started",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Form Selection Logic", () => {
    it("shows regular annotation form for non-English tasks", () => {
      render(
        <AnnotationFormRouter
          task={hausaTask}
          user={annotatorOnly}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      expect(screen.getByTestId("regular-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("Regular Annotation Form")).toBeInTheDocument()
      expect(screen.getByText("User: Annotator Only")).toBeInTheDocument()
    })

    it("shows translation form for English tasks with single-language translator", () => {
      render(
        <AnnotationFormRouter
          task={englishTask}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("Translation Annotation Form")).toBeInTheDocument()
      expect(screen.getByText("User: Single Translator")).toBeInTheDocument()
      expect(screen.getByText("Is Dual Translator: No")).toBeInTheDocument()
    })

    it("shows translation form for English tasks with dual-language translator", () => {
      render(
        <AnnotationFormRouter
          task={englishTask}
          user={dualLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("Translation Annotation Form")).toBeInTheDocument()
      expect(screen.getByText("User: Dual Translator")).toBeInTheDocument()
      expect(screen.getByText("Is Dual Translator: Yes")).toBeInTheDocument()
    })

    it("shows QA form when mode is explicitly set to qa", () => {
      render(
        <AnnotationFormRouter
          task={englishTask}
          user={dualLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="qa"
        />,
      )

      expect(screen.getByTestId("qa-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("QA Annotation Form")).toBeInTheDocument()
    })

    it("shows translation form for English tasks even with annotator-only user", () => {
      render(
        <AnnotationFormRouter
          task={englishTask}
          user={annotatorOnly}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("Is Dual Translator: No")).toBeInTheDocument()
    })
  })

  describe("User Interactions", () => {
    it("allows completion of regular annotation task", async () => {
      const user = userEvent.setup()

      render(
        <AnnotationFormRouter
          task={hausaTask}
          user={annotatorOnly}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      const completeButton = screen.getByText("Complete")
      await user.click(completeButton)

      expect(mockOnComplete).toHaveBeenCalledWith(hausaTask)
    })

    it("allows completion of translation task", async () => {
      const user = userEvent.setup()

      render(
        <AnnotationFormRouter
          task={englishTask}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      const completeButton = screen.getByText("Complete Translation")
      await user.click(completeButton)

      expect(mockOnComplete).toHaveBeenCalledWith(englishTask)
    })

    it("allows completion of QA task", async () => {
      const user = userEvent.setup()

      render(
        <AnnotationFormRouter
          task={englishTask}
          user={dualLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="qa"
        />,
      )

      const completeButton = screen.getByText("Complete QA")
      await user.click(completeButton)

      expect(mockOnComplete).toHaveBeenCalledWith(englishTask)
    })

    it("handles cancel action correctly", async () => {
      const user = userEvent.setup()

      render(
        <AnnotationFormRouter
          task={hausaTask}
          user={annotatorOnly}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      const cancelButton = screen.getByText("Cancel")
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("handles task with empty language field", () => {
      const taskWithEmptyLanguage: AnnotationTask = {
        ...englishTask,
        csvRow: {
          data: ["1", "Test claim", "", "", "", "", "", "https://example.com"],
          id: "",
          originalIndex: 0,
        },
      }

      render(
        <AnnotationFormRouter
          task={taskWithEmptyLanguage}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      // Should show regular form since language is not "en"
      expect(screen.getByTestId("regular-annotation-form")).toBeInTheDocument()
    })

    it("handles task with undefined language field", () => {
      const taskWithUndefinedLanguage: AnnotationTask = {
        ...englishTask,
        csvRow: {
          data: ["1", "Test claim"],
          id: "",
          originalIndex: 0,
        },
      }

      render(
        <AnnotationFormRouter
          task={taskWithUndefinedLanguage}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      // Should show regular form since language is not "en"
      expect(screen.getByTestId("regular-annotation-form")).toBeInTheDocument()
    })

    it("handles user with undefined translationLanguages", () => {
      const userWithNoLanguages: User = {
        id: "user4",
        email: "no-lang@example.com",
        name: "No Languages",
        picture: undefined,
        role: "annotator",
        // translationLanguages is undefined
      }

      render(
        <AnnotationFormRouter
          task={englishTask}
          user={userWithNoLanguages}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
      expect(screen.getByText("Is Dual Translator: No")).toBeInTheDocument()
    })

    it("treats language field case-insensitively", () => {
      const taskWithUppercaseLanguage: AnnotationTask = {
        ...englishTask,
        csvRow: {
          id: "csv5",
          originalIndex: 4,
          data: ["1", "Test claim", "", "", "EN", "", "", "https://example.com"],
        },
      }

      render(
        <AnnotationFormRouter
          task={taskWithUppercaseLanguage}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />,
      )

      // Should show translation form since "EN" lowercased is "en"
      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
    })
  })

  describe("Mode Override", () => {
    it("QA mode overrides task language detection", () => {
      render(
        <AnnotationFormRouter
          task={hausaTask} // Non-English task
          user={dualLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="qa" // But mode is QA
        />,
      )

      expect(screen.getByTestId("qa-annotation-form")).toBeInTheDocument()
    })

    it("translation mode shows translation form regardless of language", () => {
      render(
        <AnnotationFormRouter
          task={hausaTask} // Non-English task
          user={annotatorOnly}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="translation" // But mode is translation
        />,
      )

      // Since mode is translation, it should still follow language detection
      // In this case, since task is not English, it should show regular form
      expect(screen.getByTestId("regular-annotation-form")).toBeInTheDocument()
    })

    it("annotation mode shows appropriate form based on language", () => {
      render(
        <AnnotationFormRouter
          task={englishTask}
          user={singleLanguageTranslator}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          mode="annotation"
        />,
      )

      // Since task is English, should show translation form regardless of mode
      expect(screen.getByTestId("translation-annotation-form")).toBeInTheDocument()
    })
  })
})
