// server/src/middleware/audit.js

import {AuditLog} from "../models/AuditLog.js";
import { AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from "../config/constants.js";

const SENSITIVE_FIELDS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "passwordHash",
  "refreshToken",
  "accessToken",
  "token",
  "tokenHash",
  "otp",
  "otpCode",
  "secret",
  "apiKey",
  "authorization",
  "cookie",
]);

const sanitizeValue = (
  value,
  depth = 0
) => {
  if (depth > 5) {
    return "[TRUNCATED]";
  }

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) =>
        sanitizeValue(
          item,
          depth + 1
        )
      );
  }

  if (
    typeof value === "object"
  ) {
    const output = {};

    for (const [key, val] of Object.entries(
      value
    )) {
      if (
        SENSITIVE_FIELDS.has(
          key.toLowerCase()
        )
      ) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = sanitizeValue(
        val,
        depth + 1
      );
    }

    return output;
  }

  return String(value);
};

const getClientIp = (req) => {
  const forwarded =
    req.headers?.["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
};

const getUserAgent = (req) => {
  return (
    req.get?.("user-agent") ||
    null
  );
};

const getInstituteId = (req) => {
  return (
    req.tenant?.instituteId ||
    req.instituteId ||
    req.user?.instituteId ||
    req.auth?.instituteId ||
    null
  );
};

const resolveAction = (
  action,
  method
) => {
  if (action) {
    return action;
  }

  const normalizedMethod =
    String(method || "GET")
      .toUpperCase();

  switch (normalizedMethod) {
    case "POST":
      return AUDIT_ACTIONS.CREATE;

    case "PUT":
    case "PATCH":
      return AUDIT_ACTIONS.UPDATE;

    case "DELETE":
      return AUDIT_ACTIONS.DELETE;

    case "GET":
    default:
      return AUDIT_ACTIONS.READ;
  }
};

const createAuditEntry = async ({
  req,
  action,
  category,
  severity =
    AUDIT_SEVERITIES.INFO,
  resource,
  resourceId,
  description,
  metadata = {},
  changes,
  success = true,
  statusCode,
}) => {
  try {
    const userId =
      req.user?._id ||
      req.auth?.userId ||
      null;

    const instituteId =
      getInstituteId(req);

    const entry = {
      userId,
      instituteId,
      action: resolveAction(
        action,
        req.method
      ),
      category:
        category ||
        AUDIT_CATEGORIES.SYSTEM,
      severity,
      resource:
        resource ||
        null,
      resourceId:
        resourceId ||
        null,
      description:
        description ||
        `${req.method} ${req.originalUrl}`,
      metadata: sanitizeValue(
        metadata
      ),
      changes: changes
        ? sanitizeValue(changes)
        : undefined,
      success,
      statusCode:
        statusCode ||
        null,
      ipAddress:
        getClientIp(req),
      userAgent:
        getUserAgent(req),
      requestId:
        req.requestId ||
        null,
      method:
        req.method ||
        null,
      path:
        req.originalUrl ||
        req.url ||
        null,
    };

    return await AuditLog.create(
      entry
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error(
        "Audit log creation failed:",
        error
      );
    }

    return null;
  }
};

const auditMiddleware = ({
  action,
  category,
  severity =
    AUDIT_SEVERITIES.INFO,
  resource,
  resourceId,
  description,
  includeBody = false,
  includeQuery = false,
  includeParams = false,
  successOnly = false,
} = {}) => {
  return (req, res, next) => {
    const originalEnd =
      res.end.bind(res);

    res.end = async (
      ...args
    ) => {
      try {
        const success =
          res.statusCode >= 200 &&
          res.statusCode < 400;

        if (
          !successOnly ||
          success
        ) {
          const metadata = {};

          if (includeBody) {
            metadata.body =
              req.body;
          }

          if (includeQuery) {
            metadata.query =
              req.query;
          }

          if (includeParams) {
            metadata.params =
              req.params;
          }

          await createAuditEntry({
            req,
            action,
            category,
            severity,
            resource,
            resourceId:
              typeof resourceId ===
              "function"
                ? resourceId(req)
                : resourceId,
            description:
              typeof description ===
              "function"
                ? description(req, res)
                : description,
            metadata,
            success,
            statusCode:
              res.statusCode,
          });
        }
      } catch {
        // Audit failures must never
        // break the original request.
      }

      return originalEnd(
        ...args
      );
    };

    next();
  };
};

const audit = async (
  req,
  options = {}
) => {
  return createAuditEntry({
    req,
    ...options,
  });
};

export {
  SENSITIVE_FIELDS,
  sanitizeValue,
  getClientIp,
  getUserAgent,
  getInstituteId,
  resolveAction,
  createAuditEntry,
  auditMiddleware,
  audit,
};

export default auditMiddleware;
