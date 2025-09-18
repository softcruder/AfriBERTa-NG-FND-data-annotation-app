# AfriBERTa-NG Data Annotation Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/softcruders-projects/v0-data-annotation-app)

> Focus: End‑to‑end linguistic data pipeline – annotation → (optional) translation → quality review (QA) → administrative verification → exportable, production‑ready dataset. Payment & compensation concerns are intentionally excluded from this README (see separate internal docs if needed).

---

## 1. Abstract (System Flow at a Glance)

The platform orchestrates collaborative creation and curation of structured linguistic fact/claim or text pairs. Contributors (annotators) receive tasks, supply required fields (claims, labels, metadata, translations where relevant), and move tasks through a controlled lifecycle. A secondary quality layer (QA reviewers) evaluates completed annotations, flagging revisions or approving them. Administrators perform final verification – only verified items enter the canonical dataset export. Every transition is validated server‑side; role‑aware session enforcement + rate limiting protect integrity and performance.

High‑level lifecycle:

```
not-started ─▶ in-progress ─▶ completed ─▶ (qa-approved | admin-review) ─▶ verified
							   │                │
							   │                ├─▶ needs-revision ──┐
							   │                └─▶ invalid (terminal)
							   └──────────────────────────────────────┘ (resubmit after fixes)
```

Key guarantees:
- Only verified records become part of final exports.
- All status changes are atomic and access‑controlled.
- Translation & anonymization (if configured) are deterministic steps governed by server utilities.
- Tasks are distributed fairly (client filters avoid duplicate, already locked, or terminal states).

---

## 2. Roles & Responsibilities

| Role | Capabilities |
|------|--------------|
| Annotator | Fetch & work tasks, save partial progress, submit completion, view own stats. |
| QA Reviewer | Filter completed submissions, approve, reject (needs revision), mark invalid. |
| Admin | Full oversight: manage users, force state changes, final verification, configuration updates. |
| (System) | Enforces auth, rate limits, anonymization, export integrity, status invariants. |

Principle of Least Privilege: UI components render only features relevant to the active session's role claim.

---

## 3. Core Workflow Phases

### 3.1 Task Acquisition
Client requests task lists via `app/api/tasks` with query params (pagination, status filters). Server filters by availability & role.

### 3.2 Annotation
Annotators transition a task to `in-progress` (optimistic UI guarded by server). Required fields validated (`lib/validation.ts`). Partial saves allowed before `completed`.

### 3.3 Translation (Optional Stage)
If task schema includes translation targets, annotators (or a specialized sub-role) supply translated text. Mapping helpers in `lib/annotation-mapper.ts` normalize shapes.

### 3.4 QA Review
QA reviewers see `completed` tasks. Actions:
* Approve → `qa-approved`
* Request changes → `needs-revision` (annotator re-enters flow)
* Mark invalid → `invalid` (terminal; excluded from exports)

### 3.5 Administrative Verification
Admins inspect `qa-approved` (or `admin-review`) items and elevate to `verified`. Uniqueness & duplicate prevention handled via dataset index (see Data Integrity).

### 3.6 Export
Verified items aggregated through export utilities (see `useExport.ts` + `lib/data-store.ts`). CSV / structured formats are generated on-demand with throttling.

---

## 4. Data & Status Integrity

Central state contracts live in `lib/data-store.ts` & supporting mappers:
- Enumerated statuses (string literal union) gate UI state machines.
- Transition validation: server routes reject illegal backward or cross-branch jumps (e.g., `invalid` → anything; `verified` immutable).
- Row uniqueness: `rowId` (or composite key) enforced at verification insertion.
- Anonymization: When enabled, PII fields are hashed/encrypted via `lib/encryption.ts` before persistence or export.

Edge cases considered:
1. Duplicate submission retries – idempotent by stable task identifier.
2. Race: Two reviewers process same task → first commit wins; second receives 409 styled error.
3. Partial edits after QA request – previous QA decision cleared when annotator re-submits.
4. Export paging during concurrent verification – streaming queries isolate snapshot per request.
5. Revocation – admin can quarantine suspicious tasks (future extension placeholder).

---

## 5. Architecture Overview

| Layer | Purpose | Representative Files |
|-------|---------|----------------------|
| UI / Pages | Layout, route composition | `app/`, `components/` |
| Hooks | Encapsulated data fetching + state | `custom-hooks/`, `hooks/` |
| Services | HTTP abstraction | `services/httpService.ts` |
| Domain Logic | Mapping, validation, calculators | `lib/annotation-mapper.ts`, `lib/validation.ts` |
| Auth / Session | Cookie encryption, role gating | `lib/server-auth.ts`, `lib/auth.ts` |
| Security | Rate limiting, encryption | `lib/rate-limit.ts`, `lib/encryption.ts` |
| Data Access (in-memory / external) | Task & user store | `lib/data-store.ts` |
| API Routes | State transitions & queries | `app/api/**/route.ts` |
| Export | CSV, anonymization, streaming | `lib/csv-parser.ts`, `useExport.ts` |

Sequence & lifecycle diagrams reside in `docs/` (see Section 15).

---

## 6. Directory Structure (Curated)

```
app/                Next.js (App Router) entrypoints & route handlers
components/         Reusable presentation + workflow components
custom-hooks/       Domain-driven hooks for annotation pipeline
hooks/              Cross-cutting UX/state hooks (mobile, errors, timing)
lib/                Core domain + security helpers
services/           HTTP abstraction layer
docs/               Diagrams & flow documentation
tests/              Vitest test suites & setup
styles/             Global styles
public/             Static assets
```

---

## 7. Authentication & Session Flow

Single helper: `requireSession` (`lib/server-auth.ts`)

Contract:
```ts
const { response, session } = await requireSession(request, { role?: Role })
if (response) return response // 401 or 403 pre-built
// session.accessToken, session.user (role, id, name)
```

Implementation details:
- Encrypted cookie `auth_session` (integrity + confidentiality).
- Role assertion optional; omitted = any authenticated user.
- Public routes: call once to derive optional user context.

Best Practices:
- Always early-return `response`.
- Never trust client role flags – server canonical.

---

## 8. API Conventions

| Aspect | Convention |
|--------|------------|
| Method Semantics | `GET` (idempotent fetch), `POST` (create/transition), `PATCH` (partial update), `DELETE` (terminal removal if allowed) |
| Error Shape | `{ error: { code, message } }` |
| Success Shape | Domain object or `{ ok: true }` for simple transitions |
| Rate Limit Headers | `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining`, `Retry-After` |
| Auth Failure | 401 (unauthenticated) / 403 (role mismatch) |
| Conflict | 409 for competing transitions |

---

## 9. Rate Limiting

Defined in `lib/rate-limit.ts` (token-bucket / sliding window hybrid). Defaults: 5 requests / 3s per authenticated user (fallback to IP). Override per-route at top of handlers via:

```ts
await enforceRateLimit(request, { route: "tasks:transition", limit: 10, windowMs: 5000 })
```

Return headers documented in Section 8. Surplus requests receive 429 JSON payload.

---

## 10. Validation & Mapping

`lib/validation.ts` centralizes field guards (label presence, translation completeness, required metadata). `lib/annotation-mapper.ts` standardizes inbound shapes to internal canonical form, decoupling UI flexibility from backend persistence.

Error Strategy:
- Fail fast server-side with descriptive code.
- Map validation failures to 400 with contextual key list.

---

## 11. Error Handling & Observability

`lib/error-handler.ts` normalizes thrown errors → structured response objects. UI integrates with `hooks/use-error-handler.ts` + toast notifications (`hooks/use-toast.ts`).

Categories:
- UserInputError (400)
- AuthError (401/403)
- ConflictError (409)
- RateLimitError (429)
- InternalError (500)

Future extension: plug provider (Sentry / OpenTelemetry) inside centralized handler.

---

## 12. Frontend Composition Patterns

Notable components:
- `annotation-form.tsx` – controlled form for core task fields.
- `annotate-task-page.tsx` – composition of task retrieval + form + submission logic.
- `verify-one-page.tsx` / `admin-verify-list-page.tsx` – role-specific verification dashboards.
- `queue-monitor.tsx` – real-time-ish queue state snapshot (polling or SWR revalidation).
- `annotation-monitoring.tsx` – aggregate metrics.

Hooks:
- `useTasks.ts` – task querying + mutation wrappers.
- `useAnnotations.ts` / `useMyAnnotations.ts` – personalized task subsets.
- `usePaginatedAnnotations.ts` – infinite / paginated pattern abstraction.
- `useQA.ts` – QA review actions.
- `useAdminVerify.ts` – final verification transitions.
- `useAnonymize.ts` – anonymization request workflow.
- `useExport.ts` – dataset export & progress.

Cross-cutting UI Hooks:
- `use-mobile.ts` (responsive behaviors)
- `use-time-tracking.ts` (session/effort metrics)
- `use-error-handler.ts` (centralized UX errors)

---

## 13. State Management Approach

Lightweight approach intentionally avoids global heavy stores:
- Local component state + hook encapsulation.
- SWR / fetch pattern (if present) with revalidation on mutation.
- Server is source of truth; client caches are disposable.

Advantages: Lower complexity, reduced mutation inversion bugs, clearer test seams.

---

## 14. Exports & Anonymization

Exports requested via UI call into server route performing:
1. Authorization & rate limit.
2. Snapshot selection of `verified` tasks.
3. Optional anonymization transformation (hash / remove fields) through `lib/encryption.ts` + mapping utils.
4. Streaming or buffered CSV build.

Edge: Large dataset? Apply chunk streaming & incremental flush (future optimization placeholder).

---

## 15. Diagrams & Lifecycle Documentation

Located in `docs/`:
- `annotation-flow.md` (Mermaid)
- `annotation-flow.puml` (PlantUML)
- `SEQUENCE_DIAGRAMS.md` index

Generate assets:
```
npm run diag:all
```
Prereqs: (Optional) Java + Graphviz for advanced PlantUML output.

---

## 16. Development Environment

### 16.1 Prerequisites
- Node (LTS)
- pnpm or npm (repo uses lockfile)
- (Optional) Java + Graphviz for diagrams

### 16.2 Install
```powershell
npm install
```

### 16.3 Useful Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest suites |
| `npm run lint` | ESLint static analysis |
| `npm run type-check` | tsc project type checking |
| `npm run diag:all` | Generate diagram assets |

### 16.4 Optional Strictness
Incrementally enable in `tsconfig.json`: `"strict": true`, `noUncheckedIndexedAccess`. ESLint: `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`.

---

## 17. Testing Strategy

Framework: Vitest (`tests/` + `tests/setup.ts`).

Coverage Focus:
- Transition guards (illegal status changes).
- Validation edge cases (missing required fields, malformed translation data).
- Export anonymization transformations.
- Hook behavior (pagination, duplicate avoidance, QA actions).

Sample test outline (pseudo):
```ts
it("rejects transition from invalid to completed", async () => { /* ... */ })
```

---

## 18. Security Considerations

- Encrypted cookies (no JWT leakage client-side).
- Rate limiting (burst abuse mitigation).
- Input validation (defensive boundary).
- Minimal attack surface (no unused endpoints exported).
- Future: CSP headers, structured logging, anomaly detection.

---

## 19. Performance Notes

- Code-splitting dynamic panels (lazy import heavy admin sections).
- Mobile truncation + adaptive focus styling for accessibility.
- Avoids over-fetching via paginated hooks.

---

## 20. Contribution Workflow

1. Branch from `main` using descriptive prefix (e.g., `feat/qa-bulk-approve`).
2. Add/adjust diagrams if lifecycle logic changes.
3. Run: `npm run type-check`, `npm run lint`, `npm test`.
4. Open PR linking related issue; include before/after notes for UX changes.
5. On approval, squash & merge (ensure export invariants unaffected).

---

## 21. Deployment

Hosted on Vercel.

Environment Variables (illustrative – consult secure store):
| Variable | Purpose |
|----------|---------|
| `ENCRYPTION_SECRET` | Cookie/session encryption key |
| `RATE_LIMIT_SALT` | Salt for hashing IP/user keys |
| `EXPORT_SIGNING_KEY` | (If signing export artifacts) |

Promote build via standard Vercel Git integration (push → preview → promote).

---

## 22. Roadmap (Non-Payment)

- Bulk QA actions.
- Snapshot hashing for tamper detection.
- Streaming incremental export (NDJSON).
- Webhook integration for downstream model training ingestion.
- Internationalization of UI strings.

---

## 23. Out of Scope (Explicitly Excluded Here)

Payment / incentives modules, advanced analytics dashboards, and external billing integrations are intentionally omitted from this document.

---

## 24. Quick Start Recap
```powershell
git clone <repo>
cd AfriBERTa-NG-FND-data-annotation-app
npm install
npm run dev
```
Visit `http://localhost:3000` and sign in. Begin annotating.

---

## 25. Support / Questions

Open an issue or contact the maintainer if architectural changes are planned (diagram sync required).

---

© 2025 AfriBERTa-NG Data Annotation Platform.
