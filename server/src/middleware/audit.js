// server/src/middleware/audit.js

import { AuditLog } from "../models/AuditLog.js";
import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  AUDIT_SEVERITIES,
} from "../config/constants.js";

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

const sanitizeValue = (value, depth = 0) => {
  if (depth > 5) {
    return "[TRUNCATED]";
  }

  if (value === null || value === undefined) {
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
    return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};

    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = sanitizeValue(val, depth + 1);
    }

    return output;
  }

  return String(value);
};

const getClientIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const getUserAgent = (req) => {
  return req.get?.("user-agent") || null;
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

/*
 * Map the constants.js action vocabulary onto the enum
 * the AuditLog model actually accepts. Anything unknown
 * falls back to a safe value instead of failing validation.
 */
const ACTION_ENUM_MAP = Object.freeze({
  // CRUD
  create: "create",
  read: "read",
  update: "update",
  delete: "delete",

  // Auth
  login: "login",
  logout: "logout",
  login_failed: "login_failed",
  password_changed: "password_changed",
  password_reset: "password_reset",
  password_reset_requested: "password_reset_requested",
  email_verified: "email_verified",
  account_locked: "account_locked",
  account_unlocked: "account_unlocked",
  account_suspended: "suspend",
  account_activated: "activate",
  role_changed: "role_changed",
  permission_changed: "permission_granted",
  token_refreshed: "session_created",
  token_revoked: "session_revoked",

  // OTP
  otp_sent: "send",
  otp_verified: "two_factor_verified",

  // Misc
  export: "export",
  import: "import",
  approve: "approve",
  reject: "reject",
  publish: "publish",
  archive: "archive",
  restore: "restore",
});

const CATEGORY_ENUM_MAP = Object.freeze({
  authentication: "authentication",
  authorization: "authorization",
  user: "user_management",
  user_management: "user_management",
  organization: "organization",
  academic: "education",
  education: "education",
  attendance: "attendance",
  assessment: "education",
  crm: "crm",
  support: "support",
  hr: "hr",
  payroll: "payroll",
  finance: "finance",
  notification: "communication",
  communication: "communication",
  security: "security",
  system: "system",
  configuration: "configuration",
  content: "content",
  reporting: "reporting",
  integration: "integration",
  data: "other",
  other: "other",
});

const SEVERITY_ENUM_MAP = Object.freeze({
  debug: "debug",
  info: "info",
  low: "info",
  notice: "notice",
  medium: "warning",
  warning: "warning",
  high: "error",
  error: "error",
  critical: "critical",
});

const ACTOR_TYPE_FOR_ROLE = Object.freeze({
  super_admin: "super_admin",
  admin: "admin",
});

const resolveAction = (action, method) => {
  const candidate = action
    ? String(action).trim().toLowerCase()
    : null;

  if (candidate && ACTION_ENUM_MAP[candidate]) {
    return ACTION_ENUM_MAP[candidate];
  }

  const normalizedMethod = String(method || "GET").toUpperCase();

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

const resolveCategory = (category) => {
  const candidate = category ? String(category).trim().toLowerCase() : null;

  if (candidate && CATEGORY_ENUM_MAP[candidate]) {
    return CATEGORY_ENUM_MAP[candidate];
  }

  return "system";
};

const resolveSeverity = (severity) => {
  const candidate = severity ? String(severity).trim().toLowerCase() : null;

  if (candidate && SEVERITY_ENUM_MAP[candidate]) {
    return SEVERITY_ENUM_MAP[candidate];
  }

  return "info";
};

/*
 * Flatten the metadata the old middleware passed as
 * `changes` (an object of field => value) into the
 * changeSchema entries the model expects.
 */
const buildChanges = (changes) => {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    return undefined;
  }

  const entries = Object.entries(changes).slice(0, 50);

  if (entries.length === 0) {
    return undefined;
  }

  return entries.map(([field, value]) => ({
    field,
    operation: "set",
    newValue: sanitizeValue(value),
  }));
};

const buildActorSnapshot = (req) => {
  const user = req.user;

  if (!user) {
    return { type: "unknown" };
  }

  const roles = Array.isArray(user.roles)
    ? user.roles.filter(Boolean)
    : user.role
      ? [user.role]
      : [];

  return {
    userId: user._id || null,
    type: ACTOR_TYPE_FOR_ROLE[user.role] || "user",
    role: user.role || null,
    roles: roles.map((r) => String(r)),
    name: user.name || null,
    email: user.email ? String(user.email).toLowerCase() : null,
    userCode: user.userCode || null,
  };
};

const buildResource = ({ resource, resourceId }) => {
  if (!resource && !resourceId) {
    return null;
  }

  return {
    type: resource ? String(resource) : null,
    model: resource ? String(resource) : null,
    id: resourceId || null,
  };
};

const buildRequestContext = (req, statusCode) => {
  const headers = req.headers || {};

  return {
    requestId: req.requestId || null,
    correlationId: headers["x-correlation-id"] || null,
    method: req.method || null,
    route: req.route?.path || null,
    endpoint: req.originalUrl || req.url || null,
    statusCode: typeof statusCode === "number" ? statusCode : null,
    ipAddress: getClientIp(req),
    forwardedFor: headers["x-forwarded-for"] || null,
    userAgent: getUserAgent(req),
    origin: headers.origin || null,
    referer: headers.referer || null,
    host: headers.host || null,
    protocol: req.protocol || null,
    platform: headers["x-platform"] || null,
    appVersion: headers["x-app-version"] || null,
  };
};

const createAuditEntry = async ({
  req,
  action,
  category,
  severity = AUDIT_SEVERITIES.INFO,
  resource,
  resourceId,
  description,
  metadata = {},
  changes,
  success = true,
  statusCode,
}) => {
  try {
    const userId = req.user?._id || req.auth?.userId || null;
    const outcome = success ? "success" : "failure";
    const actorSnapshot = buildActorSnapshot(req);

    const entry = {
      instituteId: getInstituteId(req),

      actor: actorSnapshot,
      actorId: userId,
      actorType: actorSnapshot.type,

      action: resolveAction(action, req.method),
      category: resolveCategory(category),
      severity: resolveSeverity(severity),
      outcome,

      resource: buildResource({ resource, resourceId }),
      resourceId: resourceId || null,
      resourceType: resource ? String(resource) : null,

      description: description || `${req.method} ${req.originalUrl}`,

      changes: buildChanges(changes) || [],
      metadata: sanitizeValue(metadata) || null,

      request: buildRequestContext(req, statusCode),
      source: "api",
    };

    return await AuditLog.create(entry);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Audit log creation failed:", error);
    }

    return null;
  }
};

const auditMiddleware = ({
  action,
  category,
  severity = AUDIT_SEVERITIES.INFO,
  resource,
  resourceId,
  description,
  includeBody = false,
  includeQuery = false,
  includeParams = false,
  successOnly = false,
} = {}) => {
  return (req, res, next) => {
    const originalEnd = res.end.bind(res);

    res.end = async (...args) => {
      try {
        const success = res.statusCode >= 200 && res.statusCode < 400;

        if (!successOnly || success) {
          const metadata = {};

          if (includeBody) {
            metadata.body = req.body;
          }

          if (includeQuery) {
            metadata.query = req.query;
          }

          if (includeParams) {
            metadata.params = req.params;
          }

          await createAuditEntry({
            req,
            action,
            category,
            severity,
            resource,
            resourceId:
              typeof resourceId === "function" ? resourceId(req) : resourceId,
            description:
              typeof description === "function"
                ? description(req, res)
                : description,
            metadata,
            success,
            statusCode: res.statusCode,
          });
        }
      } catch {
        // Audit failures must never break the original request.
      }

      return originalEnd(...args);
    };

    next();
  };
};

const audit = async (req, options = {}) => {
  return createAuditEntry({ req, ...options });
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
