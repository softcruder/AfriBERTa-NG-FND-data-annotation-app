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

```ts
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
```

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
