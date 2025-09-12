"use client"

import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { AnnotationFormRouter } from "./forms/annotation-form-router"

interface AnnotationFormProps {
  task: AnnotationTask
  user: User
  onComplete: (task: AnnotationTask) => Promise<void>
  onCancel: () => void
  mode?: "annotation" | "translation"
}

export function AnnotationForm({ task, user, onComplete, onCancel, mode }: AnnotationFormProps) {
  return <AnnotationFormRouter task={task} user={user} onComplete={onComplete} onCancel={onCancel} mode={mode} />
}
