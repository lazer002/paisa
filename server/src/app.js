// server/src/app.js

import express from "express";
import compression from "compression";

import env from "./config/env.js";
import logger from "./config/logger.js";

import routes from "./routes/index.js";

import {
  requestId,
  security,
  securityHeaders,
  apiRateLimiter,
  errorHandler,
  notFoundHandler,
} from "./middleware/index.js";

const app = express();

/*
|--------------------------------------------------------------------------
| Application
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");

app.set(
  "trust proxy",
  env.TRUST_PROXY === "true"
    ? true
    : env.TRUST_PROXY === "false"
      ? false
      : Number(env.TRUST_PROXY)
);

app.set("etag", "strong");

/*
|--------------------------------------------------------------------------
| Request / Security Middleware
|--------------------------------------------------------------------------
*/

app.use(requestId);

app.use(security);

app.use(securityHeaders);

app.use(
  compression({
    threshold: 1024,
  })
);

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: env.JSON_BODY_LIMIT || "1mb",
    strict: true,
    type: [
      "application/json",
      "application/*+json",
    ],
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: env.URLENCODED_BODY_LIMIT || "1mb",
    parameterLimit: 1000,
  })
);

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
*/

app.use(apiRateLimiter);

/*
|--------------------------------------------------------------------------
| Request Context
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  req.context = {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl || req.url || null,
    ip: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get("user-agent") || null,
  };

  next();
});

/*
|--------------------------------------------------------------------------
| Health Checks
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: env.APP_NAME || "PAISA API",
    version: env.APP_VERSION || "1.0.0",
    environment: env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    requestId: req.requestId || null,
  });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    requestId: req.requestId || null,
  });
});

app.get("/health/ready", async (req, res, next) => {
  try {
    const checks = {
      api: true,
      database: false,
      redis: false,
    };

    /*
     * MongoDB
     */
    try {
      const mongoose = await import("mongoose");

      checks.database =
        mongoose.default.connection.readyState === 1;
    } catch {
      checks.database = false;
    }

    /*
     * Redis
     */
    try {
      const { isRedisReady } = await import(
        "./config/redis.js"
      );

      checks.redis = isRedisReady();
    } catch {
      checks.redis = false;
    }

    const ready =
      checks.api &&
      checks.database &&
      (checks.redis || !env.REDIS_REQUIRED);

    return res
      .status(ready ? 200 : 503)
      .json({
        success: ready,
        status: ready ? "ready" : "not_ready",
        checks,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || null,
      });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

const apiPrefix = env.API_PREFIX || "/api";

app.use(apiPrefix, routes);

/*
|--------------------------------------------------------------------------
| Root
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PAISA Backend Running Successfully",
    version: env.APP_VERSION || "1.0.0",
    environment: env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(notFoundHandler);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Express Error Event
|--------------------------------------------------------------------------
*/

app.on("error", (error) => {
  logger.error("Express application error", {
    error,
  });
});

export default app;