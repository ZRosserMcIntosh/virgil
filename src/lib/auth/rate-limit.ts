/**
 * VIRGIL — Rate limiter.
 *
 * In-memory sliding window per user. Resets on server restart.
 * For production, swap with Redis or Upstash.
 */

const windows = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 30;           // 30 requests per minute

export function rateLimit(
  key: string,
  maxRequests = DEFAULT_MAX,
  windowMs = DEFAULT_WINDOW_MS,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now > existing.resetAt) {
    const entry = { count: 1, resetAt: now + windowMs };
    windows.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  existing.count++;
  const remaining = Math.max(0, maxRequests - existing.count);
  return {
    allowed: existing.count <= maxRequests,
    remaining,
    resetAt: existing.resetAt,
  };
}

/**
 * Convenience: check rate limit and return a 429 Response if exceeded.
 */
export function checkRateLimit(userId: string, endpoint: string, max = DEFAULT_MAX) {
  const { allowed, remaining, resetAt } = rateLimit(`${userId}:${endpoint}`, max);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    });
  }
  return null; // allowed
}
