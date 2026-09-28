// server/src/middleware/rateLimiter.js

import ApiError from "../utils/ApiError.js";
import {
  increment,
  expire,
  ttl,
  get,
  cacheKey,
} from "../utils/redis.js";

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 100;

const getClientIp = (req) => {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

const getIdentifier = (
  req,
  keyGenerator
) => {
  if (typeof keyGenerator === "function") {
    return keyGenerator(req);
  }

  return getClientIp(req);
};

const createRateLimiter = ({
  windowSeconds = DEFAULT_WINDOW_SECONDS,
  maxRequests = DEFAULT_MAX_REQUESTS,
  keyPrefix = "api",
  keyGenerator,
  message = "Too many requests. Please try again later.",
  skip,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
} = {}) => {
  return async (req, res, next) => {
    try {
      if (
        typeof skip === "function" &&
        (await skip(req))
      ) {
        return next();
      }

      const identifier =
        getIdentifier(
          req,
          keyGenerator
        );

      const key = cacheKey.custom(
        "rate-limit",
        keyPrefix,
        identifier
      );

      const current =
        await increment(key, 1);

      if (current === null) {
        return next();
      }

      let remainingTtl =
        await ttl(key);

      if (
        remainingTtl === -1 ||
        remainingTtl === -2
      ) {
        await expire(
          key,
          windowSeconds
        );

        remainingTtl =
          windowSeconds;
      }

      const remaining = Math.max(
        0,
        maxRequests - current
      );

      res.setHeader(
        "X-RateLimit-Limit",
        String(maxRequests)
      );

      res.setHeader(
        "X-RateLimit-Remaining",
        String(remaining)
      );

      res.setHeader(
        "X-RateLimit-Reset",
        String(
          Math.ceil(
            Date.now() / 1000
          ) + remainingTtl
        )
      );

      if (current > maxRequests) {
        res.setHeader(
          "Retry-After",
          String(remainingTtl)
        );

        if (skipSuccessfulRequests) {
          const originalEnd =
            res.end.bind(res);

          res.end = async (...args) => {
            if (
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              const currentValue =
                await get(key);

              if (
                currentValue !== null &&
                Number(currentValue) > 0
              ) {
                await increment(key, -1);
              }
            }

            return originalEnd(...args);
          };
        }

        throw ApiError.tooManyRequests(
          message,
          "RATE_LIMIT_EXCEEDED",
          {
            retryAfter: remainingTtl,
          }
        );
      }

      if (skipFailedRequests) {
        const originalEnd =
          res.end.bind(res);

        res.end = async (...args) => {
          if (res.statusCode >= 400) {
            const currentValue =
              await get(key);

            if (
              currentValue !== null &&
              Number(currentValue) > 0
            ) {
              await increment(key, -1);
            }
          }

          return originalEnd(...args);
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const apiRateLimiter =
  createRateLimiter({
    windowSeconds: 60,
    maxRequests: 100,
    keyPrefix: "api",
  });

const authRateLimiter =
  createRateLimiter({
    windowSeconds: 15 * 60,
    maxRequests: 20,
    keyPrefix: "auth",
  });

const loginRateLimiter =
  createRateLimiter({
    windowSeconds: 15 * 60,
    maxRequests: 10,
    keyPrefix: "login",
  });

const otpRateLimiter =
  createRateLimiter({
    windowSeconds: 10 * 60,
    maxRequests: 5,
    keyPrefix: "otp",
  });

const passwordResetRateLimiter =
  createRateLimiter({
    windowSeconds: 15 * 60,
    maxRequests: 5,
    keyPrefix: "password-reset",
  });

const emailVerificationRateLimiter =
  createRateLimiter({
    windowSeconds: 15 * 60,
    maxRequests: 10,
    keyPrefix: "email-verification",
  });

const uploadRateLimiter =
  createRateLimiter({
    windowSeconds: 60,
    maxRequests: 30,
    keyPrefix: "upload",
  });

const strictRateLimiter =
  createRateLimiter({
    windowSeconds: 60,
    maxRequests: 10,
    keyPrefix: "strict",
  });

const userRateLimiter =
  createRateLimiter({
    windowSeconds: 60,
    maxRequests: 60,
    keyPrefix: "user",
    keyGenerator: (req) =>
      req.user?._id
        ? `user:${req.user._id}`
        : getClientIp(req),
  });

export {
  DEFAULT_WINDOW_SECONDS,
  DEFAULT_MAX_REQUESTS,
  getClientIp,
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
  uploadRateLimiter,
  strictRateLimiter,
  userRateLimiter,
};

export default createRateLimiter;
