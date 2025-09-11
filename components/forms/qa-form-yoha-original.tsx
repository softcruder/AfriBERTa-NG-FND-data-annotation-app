"use client"

import type { User } from "@/lib/auth"
import type { AnnotationTask } from "@/lib/data-store"
import { BaseQAForm } from "./base-qa-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useFormContext } from "react-hook-form"
import type { AnnotationFormData } from "@/lib/validation"

export function QAFormYOHAOriginal({
  task,
  user,
  onComplete,
  onCancel,
}: {
  task: AnnotationTask
  user: User
  onComplete: (t: AnnotationTask) => void
  onCancel: () => void
}) {
  return (
    <BaseQAForm task={task} user={user} onComplete={onComplete} onCancel={onCancel}>
      <Content />
    </BaseQAForm>
  )
}

function Content() {
  const { watch, setValue } = useFormContext<AnnotationFormData>()
  const values = watch()
  // translation_language empty means original is YO or HA; show both fields side-by-side for auditing
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Claim Text (Hausa)</Label>
          <Textarea
            value={(values as any).translationHausa || ""}
            onChange={e => setValue("translationHausa" as any, e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div>
          <Label>Claim Text (Yoruba)</Label>
          <Textarea
            value={(values as any).translationYoruba || ""}
            onChange={e => setValue("translationYoruba" as any, e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Article Body (Hausa)</Label>
          <Textarea
            value={(values as any).articleBodyHausa || ""}
            onChange={e => setValue("articleBodyHausa" as any, e.target.value)}
            className="min-h-[140px]"
          />
        </div>
        <div>
          <Label>Article Body (Yoruba)</Label>
          <Textarea
            value={(values as any).articleBodyYoruba || ""}
            onChange={e => setValue("articleBodyYoruba" as any, e.target.value)}
            className="min-h-[140px]"
          />
        </div>
      </div>
    </div>
  )
}
