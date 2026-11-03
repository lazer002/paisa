// server/src/routes/publicRoutes.js
//
// Unauthenticated routes. Mounted at /public, no authenticate step.
// Every route here must be rate-limited and return minimal data.

import express from "express";

import { verifyCertificate } from "../controllers/publicController.js";
import { kioskDisplay } from "../controllers/kioskController.js";

import {
  createRateLimiter,
  getClientIp,
} from "../middleware/rateLimiter.js";

import ApiError from "../utils/ApiError.js";

const router = express.Router();

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

// Redis-backed limiter (shared across instances when Redis is up).
const redisLimiter = createRateLimiter({
  windowSeconds: WINDOW_SECONDS,
  maxRequests: MAX_REQUESTS,
  keyPrefix: "public-verify",
  message: "Too many verification attempts. Please try again later.",
});

// The Redis limiter is a no-op without Redis, so keep an in-process
// fixed window as well; public lookups must never be unlimited.
const hits = new Map();

const memoryLimiter = (req, res, next) => {
  const now = Date.now();
  const ip = getClientIp(req);
  let entry = hits.get(ip);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
    hits.set(ip, entry);
  }

  entry.count += 1;

  if (hits.size > 10000) {
    for (const [key, value] of hits) {
      if (value.resetAt <= now) hits.delete(key);
    }
  }

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return next(
      ApiError.tooManyRequests(
        "Too many verification attempts. Please try again later.",
        { code: "RATE_LIMIT_EXCEEDED" }
      )
    );
  }

  return next();
};

router.get(
  "/certificates/:code",
  redisLimiter,
  memoryLimiter,
  verifyCertificate
);

// The attendance kiosk screen fetches its rotating code (token in the URL).
router.get(
  "/kiosk/:token",
  redisLimiter,
  memoryLimiter,
  kioskDisplay
);

export default router;
