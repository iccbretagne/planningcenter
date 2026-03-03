const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs?: number; // Time window in ms (default 60s)
  max?: number; // Max requests per window (default 60)
}

export function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): { success: boolean; remaining: number } {
  const { windowMs = 60_000, max = 60 } = options;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  entry.count++;

  if (entry.count > max) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: max - entry.count };
}

// Cleanup stale entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 300_000);
}
