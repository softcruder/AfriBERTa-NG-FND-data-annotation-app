# Data annotation app

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/softcruders-projects/v0-data-annotation-app)

## Overview

## Deployment

Your project is live at:

**[https://vercel.com/softcruders-projects/v0-data-annotation-app](https://vercel.com/softcruders-projects/v0-data-annotation-app)**

## Build your app

## How It Works

## API rate limiting

To protect Google APIs and the app from abuse, all API routes are throttled using a lightweight, in-memory limiter.

- Default policy: 5 requests per 3 seconds per user (or IP if unauthenticated)
- Overrides exist for sensitive routes (e.g., exports, anonymize, sheet creation)
- Headers returned on throttle: `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining`, and `Retry-After`

Implementation lives in `lib/rate-limit.ts`. To tune limits per route, change the `enforceRateLimit(request, { route, limit, windowMs })` options at the top of each handler in `app/api/**/route.ts`.
