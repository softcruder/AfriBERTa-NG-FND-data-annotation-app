import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"

type RateLimitOptions = {
  windowMs?: number // default 3000ms
  limit?: number // default 5
  keyOverride?: string // explicit key if provided
  route?: string // optional hint to segment limits per route
}

type Bucket = { timestamps: number[] }

// Simple in-memory store (per process). Good enough for single-node or dev.
const store = new Map<string, Bucket>()

function getClientKey(req: NextRequest, route?: string, override?: string): string {
  if (override) return route ? `${route}:${override}` : override

  // Prefer authenticated user id
  try {
    const session = getSessionFromRequest(req as unknown as Request)
    if (session?.user?.id) return route ? `${route}:${session.user.id}` : session.user.id
  } catch {
    // ignore
  }

  // Fallback to IP address
  const xff = req.headers.get("x-forwarded-for") || ""
  const ip = xff.split(",")[0]?.trim() || (req as any).ip || "unknown"
  return route ? `${route}:${ip}` : ip
}

export async function checkRateLimit(
  req: NextRequest,
  { windowMs = 3000, limit = 5, keyOverride, route }: RateLimitOptions = {},
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const now = Date.now()
  const key = getClientKey(req, route, keyOverride)
  const bucket = store.get(key) ?? { timestamps: [] }

  // Drop timestamps outside the window
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)

  // If exceeding limit, block
  if (bucket.timestamps.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket.timestamps[0])
    const headers: Record<string, string> = {
      "RateLimit-Policy": `${limit};w=${Math.ceil(windowMs / 1000)}`,
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": "0",
      "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
    }
    const res = NextResponse.json(
      { error: "Too many requests. Please slow down and try again." },
      { status: 429, headers },
    )
    return { allowed: false, response: res }
  }

  // Record this hit
  bucket.timestamps.push(now)
  store.set(key, bucket)

  return { allowed: true }
}

// Convenience wrapper that returns early 429 when not allowed
export async function enforceRateLimit(req: NextRequest, opts?: RateLimitOptions) {
  const result = await checkRateLimit(req, opts)
  if (result.allowed) return null
  return result.response
}
