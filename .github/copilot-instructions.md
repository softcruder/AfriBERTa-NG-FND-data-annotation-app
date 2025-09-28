## Copilot Project Instructions

Purpose: Focused guide for AI agents working on this Next.js 15 App‑Router fact‑checking & multilingual annotation platform.

1. Architecture: UI routes in `app/` (API handlers beside route segments). UI in `components/` stays presentational; move business logic to hooks (`custom-hooks/`, `hooks/`) or pure funcs in `lib/`; side‑effects (HTTP/Sheets) in `services/`.
2. Auth: All protected API handlers start with `requireSession` from `lib/server-auth.ts`; always `if (response) return response`. Only roles: `annotator | admin` (allow‑list in `SESSION_SECURITY.md`). Session cookie `auth_session` is encrypted (see `lib/encryption.ts`).
3. HTTP Transport: Always import the singleton `httpService` (`services/httpService.ts`). It handles 401 single‑flight refresh (`/api/auth/refresh`) + idempotent GET retries. Never create a new Axios instance or manual refresh logic.
4. Rate Limiting: Heavy routes (export/sheets/drive/anonymize) call `enforceRateLimit(req,{ route:"name" })` early. Defaults: 5 requests / 3s per user/IP (`lib/rate-limit.ts`). Return early on 429.
5. Payments: Never hardcode rates—use `parsePaymentRatesFromConfig` + `isDualTranslator` (in `payment-calculator.ts`). If adding payment fields update: interface, sheet header logic, calculator, export mappers in one change.
6. Annotation & Validation: Modes (regular / single / dual) drive required translation fields. Validation (`lib/validation.ts`) enforces: (a) `claims[]` non-empty, (b) `articleBody` min 50 chars, (c) dual translators must supply BOTH `translationHausa` & `translationYoruba` plus paired article bodies, (d) single translators must provide translation + `translationLanguage` + matching article body, (e) invalid task => `invalidityReason` required, (f) verdict silently normalized to core enum (True|False|Misleading) mapping legacy values to validation errors.
7. QA Flow: Status lifecycle includes `qa-pending` -> `qa-approved` (see status usage in `lib/data-store.ts`, mapping in `lib/annotation-mapper.ts`). QA form sets `isQAMode` + `qaComments`. Updating QA status writes Sheets columns I (Status), J (Verified_By), Y (qaComments), Z (isValid) via `updateAnnotationStatus` (`lib/google-apis.ts`). After QA approval we must recalc payments (approved counts, qaCount, redeemable amount); locate existing payment update calls instead of adding new divergent logic.
8. Hooks Pattern: Name `useX` and return stable shape `{ data, isLoading, error, ...actions }`. All network calls go through `httpService`. Centralize error mapping (don’t throw raw errors from components).
9. Testing: Run `npm run type-check`, `npm run lint`, `npm test` (Vitest + Testing Library, DOM via `tests/setup.ts`). Mock HTTP by stubbing the axios instance from `httpService.getRawInstance()`; never hit Google APIs in tests.
10. Styling & Accessibility: Tailwind v4 + Radix primitives + `class-variance-authority`. Respect existing focus-visible + reduced-motion patterns (`app/globals.css`, `components/input-modality-listener.tsx`). Add variants instead of large conditional class chains.
11. Error & UX: Return JSON `{ error: string }` from APIs; surface user-friendly toasts for rate limit (don’t dump raw JSON). Lazy-load heavy admin panels similar to payment dashboard dynamic import pattern.
12. Contribution Checklist: (a) Auth + optional rate limit in new API handler. (b) Pure calc/transform -> `lib/`; side-effects -> `services/`; UI state/data orchestration -> hook. (c) No duplicated constants—extract to `lib/utils.ts`. (d) Added/updated tests & zero new `any`. (e) Respect existing role + mode gating.
13. Pitfalls: Missing `if (response) return response`; recreating Axios; forgetting dual vs single translation rate difference; not updating all payment pipeline spots; bypassing schema in `validation.ts` (never duplicate ad-hoc checks in components); failing to keep QA status + payment recalculation coupled.
14. Quick Refs: Auth `lib/server-auth.ts`; HTTP `services/httpService.ts`; Rates `lib/payment-calculator.ts`; RateLimit `lib/rate-limit.ts`; Validation `lib/validation.ts`; QA update `updateAnnotationStatus` in `lib/google-apis.ts`; Core form `components/annotation-form.tsx`.

API Handler Template (App Router `route.ts`):

```ts
// app/api/annotations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
import { annotationFormSchema } from "@/lib/validation"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. Auth
  const { response, session } = await requireSession(req, { role: "annotator" })
  if (response) return response
  // 2. Rate limit (optional heavier endpoints)
  const limited = await enforceRateLimit(req, { route: "annotation-write" })
  if (limited) return limited
  // 3. Parse & validate
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = annotationFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.format() }, { status: 422 })
  }
  const data = parsed.data
  // 4. Domain operation (persist, sheet update, QA/payment triggers as needed)
  // await saveAnnotation(session!.user.id, params.id, data)
  // 5. Success
  return NextResponse.json({ ok: true })
}
```

Operate by reading similar existing code first, replicate established patterns, then extend. When uncertain: search the repo (hooks or API route analog) before introducing a new pattern.
