"use client"

import React from "react"
import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { isDualTranslator } from "@/lib/payment-calculator"
import { QAFormYOHAOriginal } from "./qa-form-yoha-original"
import { QAFormENDual } from "./qa-form-en-dual"
import { QAFormENSingle } from "./qa-form-en-single"

export function QAFormRouter({
  task,
  user,
  onComplete,
  onCancel,
}: {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => void
  onCancel: () => void
}) {
  const claimLanguage = (task.csvRow.data[4] || "").trim().toLowerCase()
  const isEN = claimLanguage === "en"
  const isDual = isDualTranslator(user.translationLanguages?.join(",") || "")
  const hasTranslationLanguage = Boolean(task.translationLanguage)
  console.log("QAFormRouter", { task, claimLanguage, isEN, isDual, hasTranslationLanguage })

  // 1) YO/HA original: translation_language empty
  if (!hasTranslationLanguage && !isEN) {
    return <QAFormYOHAOriginal task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
  }
  // 2) EN double translation: EN + dual translator
  if (isEN && isDual) {
    return <QAFormENDual task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
  }
  // 3) EN single translation: EN + single translator
  return <QAFormENSingle task={task} user={user} onComplete={onComplete} onCancel={onCancel} />
}
