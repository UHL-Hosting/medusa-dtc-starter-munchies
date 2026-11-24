import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { defineMiddlewares } from "@medusajs/medusa";

// Small per-instance fixed-window limiter for public, unauthenticated
// endpoints that trigger email sends. For multi-instance deployments this
// needs a shared store (e.g. Redis).
function rateLimit({ max, windowMs }: { max: number; windowMs: number }) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size > 10000) {
        for (const [bucketKey, value] of buckets) {
          if (value.resetAt <= now) {
            buckets.delete(bucketKey);
          }
        }
      }

      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
      return;
    }

    next();
  };
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/subscribe-to-newsletter",
      method: "POST",
      middlewares: [rateLimit({ max: 5, windowMs: 15 * 60 * 1000 })],
    },
    {
      matcher: "/store/newsletter/confirm",
      method: ["GET", "POST"],
      middlewares: [rateLimit({ max: 30, windowMs: 15 * 60 * 1000 })],
    },
  ],
});
