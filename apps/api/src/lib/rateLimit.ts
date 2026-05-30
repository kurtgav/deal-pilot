import type { RequestHandler } from 'express';

/**
 * Minimal in-memory fixed-window rate limiter (zero deps). Protects the API
 * from request floods and runaway LLM cost. Keyed by authenticated user id
 * when present, else client IP. Sufficient for a single-instance deploy; move
 * to a shared store (Redis) if the API is horizontally scaled.
 */
export function rateLimit(opts: { windowMs: number; max: number }): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    const key =
      req.user?.id ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    let e = hits.get(key);
    if (!e || now >= e.resetAt) {
      e = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, e);
    }
    e.count++;

    if (e.count > opts.max) {
      res.setHeader('Retry-After', Math.ceil((e.resetAt - now) / 1000));
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    next();
  };
}
