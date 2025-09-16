# Data annotation app

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/softcruders-projects/v0-data-annotation-app)

## Overview

## Deployment

Your project is live at:

**[https://vercel.com/softcruders-projects/v0-data-annotation-app](https://vercel.com/softcruders-projects/v0-data-annotation-app)**

## Build your app

## How It Works

### Authentication helper (requireSession)

Server routes use a single auth helper `requireSession` from `lib/server-auth.ts` to read and validate the encrypted cookie `auth_session` and enforce roles.

Usage:

- `const { response, session } = await requireSession(request)`
- `const { response, session } = await requireSession(request, { role: "admin" })`
- If `response` is defined, return it immediately (it contains 401/403); otherwise, use `session!.accessToken` and `session!.user`.

Example:

\`\`\`ts
import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
const { response, session } = await requireSession(request)
if (response) return response
// do work with session!.accessToken
return NextResponse.json({ user: session!.user })
}

export async function POST(request: NextRequest) {
const { response, session } = await requireSession(request, { role: "admin" })
if (response) return response // 403 for non-admins
// admin-only logic here
return NextResponse.json({ ok: true })
}
\`\`\`

Migration notes:

- Remove ad-hoc cookie parsing and `getSessionFromCookie` in API routes.
- Always check and early-return `response` from `requireSession`.
- For public routes, call `requireSession(request)` without the `role` option.

## API rate limiting

To protect Google APIs and the app from abuse, all API routes are throttled using a lightweight, in-memory limiter.

- Default policy: 5 requests per 3 seconds per user (or IP if unauthenticated)
- Overrides exist for sensitive routes (e.g., exports, anonymize, sheet creation)
- Headers returned on throttle: `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining`, and `Retry-After`

Implementation lives in `lib/rate-limit.ts`. To tune limits per route, change the `enforceRateLimit(request, { route, limit, windowMs })` options at the top of each handler in `app/api/**/route.ts`.

### Optional stricter TS/ESLint settings

Once types are tightened across hooks/components, consider enabling stricter checks:

- TypeScript: set `"strict": true` and enable `noUncheckedIndexedAccess` in `tsconfig.json`.
- ESLint: enable rules like `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`, and tighten import rules.

Do this incrementally: enable strict options, fix surfaced issues, and keep tests green. If needed, scope strictness to `app/` and `components/` first via ESLint overrides.

## Recent UX / Accessibility Improvements (2025-09-12)

The following enhancements were introduced to improve mobile usability, performance, and accessibility:

- Mobile task text truncation: Long claim text in task rows now uses multi-line clamp (2 lines on very small screens) to prevent layout overflow.
- Focus-visible refinement: Adaptive focus ring system distinguishes keyboard vs pointer modality with a root `data-input-modality` attribute and improved contrast rings.
- Summary chip bar (mobile): High-density horizontally scrollable stat chips for quick glance metrics on small devices.
- Lazy loading: Heavy panels (e.g., payments dashboard) are dynamically imported to reduce initial Time To Interactive on mobile.
- Tab removal on mobile: Annotation/Payments tab interface hidden below `sm` breakpoint; replaced with simplified stacked sections.
- Motion reduction: Global `prefers-reduced-motion` handling disables non-essential animations for users requesting reduced motion.
- Custom 404: New design-system aligned `app/not-found.tsx` with clear recovery actions.
- Test coverage: Added mobile truncation test for `TasksListPage`.

These changes aim to streamline annotator workflows on constrained devices while maintaining accessibility and performance.

## Documentation & Architecture Diagrams

Sequence diagrams and lifecycle documentation for the annotation → translation → QA → final dataset pipeline live in the `docs/` directory:

- `docs/annotation-flow.md` – Mermaid diagrams (view directly in VS Code Markdown preview)
- `docs/annotation-flow.puml` – PlantUML master diagram (render with PlantUML extension)
- `docs/SEQUENCE_DIAGRAMS.md` – Aggregated index + maintenance procedure

Status transitions covered:
```
not-started → in-progress → completed → (qa-approved | admin-review) → verified
						↘ needs-revision (admin) ↗ resubmit
						↘ invalid (terminal)
```

Final dataset insertion only occurs on transition to `verified` (guarded for uniqueness by `rowId`).

When adding a new status or altering QA logic:
1. Update types in `lib/data-store.ts`.
2. Adjust filtering in `app/api/tasks/route.ts`.
3. Update verification logic in `app/api/qa/verify/route.ts` (and `app/api/admin/verify/route.ts` if applicable).
4. Refresh diagrams in `docs/` and commit with message `docs: update sequence diagrams`.

Rendering tools:
- Mermaid CLI (optional): `npm i -g @mermaid-js/mermaid-cli`
- PlantUML VS Code extension: `jebbs.plantuml`

### Diagram Export Automation

Scripts added to `package.json`:

| Script | Output |
|--------|--------|
| `npm run diag:mermaid:png` | PNGs for each Mermaid diagram in `docs/` |
| `npm run diag:mermaid:jpg` | JPEGs for each Mermaid diagram |
| `npm run diag:plantuml:png` | PNG for `annotation-flow.puml` |
| `npm run diag:plantuml:jpg` | JPEG for `annotation-flow.puml` |
| `npm run diag:all` | High-level PNG exports (Mermaid + PlantUML) |

Prerequisites:

1. Install dependencies (includes CLI tools):

```powershell
npm install
```

1. For PlantUML advanced rendering you may need Java + Graphviz (`dot`) in PATH. The Node `plantuml` wrapper can still produce basic outputs.

Generated assets will appear alongside source files inside `docs/`.


