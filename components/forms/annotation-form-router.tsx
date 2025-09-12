"use client"

import React from "react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { RegularAnnotationForm } from "./regular-annotation-form"
import { TranslationAnnotationForm } from "./translation-annotation-form"
import { QAAnnotationForm } from "./qa-annotation-form"

interface AnnotationFormRouterProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
  mode?: "annotation" | "translation" | "qa"
}

export function AnnotationFormRouter({ task, user, onComplete, onCancel, mode }: AnnotationFormRouterProps) {
  const claimLanguage = (task.csvRow.data[4] || "").trim().toLowerCase()
  const needsTranslation = claimLanguage === "en"

  if (mode === "qa") {
    return (
      <div data-testid="qa-annotation-wrapper">
        <QAAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
      </div>
    )
  }

  if (needsTranslation) {
    // For translation tasks, always use TranslationAnnotationForm
    // The form itself will handle dual vs single translator UI based on user capabilities
    return <TranslationAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
  }

  return <RegularAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
}
