// Simple rate limiting utility
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitMap.get(key)!;

  if (now > record.resetTime) {
    // Reset window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  rateLimitMap.set(key, record);
  return true;
}

export function getRemainingTime(identifier: string): number {
  const record = rateLimitMap.get(identifier);
  if (!record) return 0;

  const remaining = record.resetTime - Date.now();
  return Math.max(0, remaining);
}
