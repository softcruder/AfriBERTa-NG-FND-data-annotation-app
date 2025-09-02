"use client"

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

  // Determine the appropriate form based on mode or language
  if (mode === "qa") {
    return <QAAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
  }

  if (needsTranslation) {
    return <TranslationAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
  }

  return <RegularAnnotationForm task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
}
