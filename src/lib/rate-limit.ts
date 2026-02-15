/**
 * In-memory rate limiter (fixed window). Use per-instance; for multi-instance use Redis.
 */

const windowMs = 60 * 1000; // 1 min
const store = new Map<string, { count: number; resetAt: number }>();

function getKey(id: string): { count: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(id);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(id, { count: 1, resetAt });
    return { count: 1, resetAt };
  }
  entry.count++;
  return entry;
}

/**
 * Returns true if allowed, false if over limit. Call before doing work.
 */
export function checkRateLimit(key: string, limitPerMin: number): boolean {
  const { count } = getKey(key);
  return count <= limitPerMin;
}

/**
 * Prune old entries to avoid unbounded growth (call periodically if needed).
 */
export function prune(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now >= v.resetAt) store.delete(k);
  }
}
