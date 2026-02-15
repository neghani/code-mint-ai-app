/**
 * Minimal logger for API routes. Production: scope + message only. Dev: full error.
 */
const isProd = process.env.NODE_ENV === "production";

export function logError(scope: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (isProd) {
    console.error(`[${scope}]`, msg);
  } else {
    console.error(`[${scope}]`, err);
  }
}
