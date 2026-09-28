// server/src/middleware/security.js

import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "../config/env.js";

const normalizeOrigins = (origins) => {
  if (!origins) {
    return [];
  }

  if (Array.isArray(origins)) {
    return origins
      .map((origin) => String(origin).trim())
      .filter(Boolean);
  }

  return String(origins)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = normalizeOrigins(
  env.CORS_ORIGIN ||
    env.CORS_ORIGINS ||
    env.FRONTEND_URL
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.includes("*")
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(
        "Origin is not allowed by CORS policy"
      )
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Accept",
    "Authorization",
    "Content-Type",
    "Origin",
    "X-Requested-With",
    "X-Request-ID",
    "X-Institute-ID",
    "X-Organization-ID",
    "Idempotency-Key",
  ],

  exposedHeaders: [
    "X-Request-ID",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "Retry-After",
  ],

  maxAge: 86400,
};

const helmetOptions = {
  contentSecurityPolicy:
    env.NODE_ENV === "production"
      ? {
          directives: {
            defaultSrc: ["'self'"],

            baseUri: ["'self'"],

            fontSrc: [
              "'self'",
              "https:",
              "data:",
            ],

            formAction: ["'self'"],

            frameAncestors: ["'none'"],

            imgSrc: [
              "'self'",
              "data:",
              "blob:",
              "https:",
            ],

            objectSrc: ["'none'"],

            scriptSrc: ["'self'"],

            scriptSrcAttr: ["'none'"],

            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https:",
            ],

            upgradeInsecureRequests: [],
          },
        }
      : false,

  crossOriginEmbedderPolicy: false,

  crossOriginOpenerPolicy: {
    policy: "same-origin",
  },

  crossOriginResourcePolicy: {
    policy: "same-site",
  },

  dnsPrefetchControl: {
    allow: false,
  },

  frameguard: {
    action: "deny",
  },

  hidePoweredBy: true,

  hsts:
    env.NODE_ENV === "production"
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,

  ieNoOpen: true,

  noSniff: true,

  originAgentCluster: true,

  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },

  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  xssFilter: false,
};

const securityMiddleware = [
  helmet(helmetOptions),
  cors(corsOptions),
  cookieParser(),
];

const securityHeaders = (
  req,
  res,
  next
) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", ")
  );

  res.setHeader(
    "Cross-Origin-Resource-Policy",
    "same-site"
  );

  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin"
  );

  next();
};

export {
  allowedOrigins,
  corsOptions,
  helmetOptions,
  securityHeaders,
};

export default securityMiddleware;
