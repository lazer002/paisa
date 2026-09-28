// server/src/config/constants.js

export const APP_CONSTANTS = Object.freeze({
  NAME: "PAISA",
  API_VERSION: "v1",
  API_PREFIX: "/api/v1",
});

export const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",

  PRINCIPAL: "principal",

  TEACHER: "teacher",

  HR: "hr",

  ACCOUNTANT: "accountant",

  COUNSELOR: "counselor",

  EMPLOYEE: "employee",

  STUDENT: "student",

  PARENT: "parent",

  SUPPORT: "support",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const USER_STATUSES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  LOCKED: "locked",
  PENDING: "pending",
  DELETED: "deleted",
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
});

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCESS_DENIED: "ACCESS_DENIED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_EXISTS: "RESOURCE_EXISTS",
  TENANT_ACCESS_DENIED: "TENANT_ACCESS_DENIED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_REVOKED: "TOKEN_REVOKED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  INVALID_REQUEST: "INVALID_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

export const AUTH = Object.freeze({
  TOKEN_TYPES: {
    ACCESS: "access",
    REFRESH: "refresh",
  },

  HEADER: "authorization",

  BEARER_PREFIX: "Bearer",

  COOKIE_ACCESS: "paisa_access",

  COOKIE_REFRESH: "paisa_refresh",
});

export const REQUEST = Object.freeze({
  ID_HEADER: "x-request-id",

  CORRELATION_ID_HEADER: "x-correlation-id",

  FORWARDED_FOR_HEADER: "x-forwarded-for",

  USER_AGENT_HEADER: "user-agent",
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,

  DEFAULT_LIMIT: 20,

  MAX_LIMIT: 100,

  MIN_LIMIT: 1,
});

export const SORT = Object.freeze({
  DEFAULT_FIELD: "createdAt",

  DEFAULT_ORDER: "desc",

  ASC: "asc",

  DESC: "desc",
});

export const ACCOUNT_SECURITY = Object.freeze({
  MAX_LOGIN_ATTEMPTS: 5,

  LOCK_DURATION_MINUTES: 30,

  PASSWORD_HISTORY_LIMIT: 5,

  OTP_LENGTH: 6,

  OTP_EXPIRY_MINUTES: 10,

  PASSWORD_RESET_EXPIRY_MINUTES: 30,

  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
});

export const PASSWORD = Object.freeze({
  MIN_LENGTH: 8,

  MAX_LENGTH: 128,

  BCRYPT_SALT_ROUNDS: 12,
});

export const RATE_LIMIT = Object.freeze({
  DEFAULT_WINDOW_MS: 15 * 60 * 1000,

  DEFAULT_MAX_REQUESTS: 300,

  AUTH_WINDOW_MS: 15 * 60 * 1000,

  AUTH_MAX_REQUESTS: 20,

  PASSWORD_RESET_WINDOW_MS: 15 * 60 * 1000,

  PASSWORD_RESET_MAX_REQUESTS: 5,

  OTP_WINDOW_MS: 10 * 60 * 1000,

  OTP_MAX_REQUESTS: 5,
});

export const CONTENT_TYPES = Object.freeze({
  JSON: "application/json",

  FORM_URLENCODED: "application/x-www-form-urlencoded",

  MULTIPART: "multipart/form-data",
});

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",

  LOGIN: "login",
  LOGOUT: "logout",

  LOGIN_FAILED: "login_failed",
  PASSWORD_CHANGED: "password_changed",
  PASSWORD_RESET: "password_reset",

  OTP_SENT: "otp_sent",
  OTP_VERIFIED: "otp_verified",

  EMAIL_VERIFIED: "email_verified",

  TOKEN_REFRESHED: "token_refreshed",
  TOKEN_REVOKED: "token_revoked",

  ROLE_CHANGED: "role_changed",
  PERMISSION_CHANGED: "permission_changed",

  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_UNLOCKED: "account_unlocked",

  ACCOUNT_SUSPENDED: "account_suspended",
  ACCOUNT_ACTIVATED: "account_activated",

  EXPORT: "export",
  IMPORT: "import",

  APPROVE: "approve",
  REJECT: "reject",

  PUBLISH: "publish",
  ARCHIVE: "archive",
  RESTORE: "restore",
});

export const AUDIT_CATEGORIES = Object.freeze({
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  USER: "user",
  ORGANIZATION: "organization",
  ACADEMIC: "academic",
  ATTENDANCE: "attendance",
  ASSESSMENT: "assessment",
  CRM: "crm",
  SUPPORT: "support",
  HR: "hr",
  FINANCE: "finance",
  NOTIFICATION: "notification",
  SECURITY: "security",
  SYSTEM: "system",
  DATA: "data",
});

export const AUDIT_SEVERITIES = Object.freeze({
  INFO: "info",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

export const EVENT_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  PROCESSED: "processed",
  FAILED: "failed",
  DEAD_LETTER: "dead_letter",
  CANCELLED: "cancelled",
});

export const EVENT_SOURCES = Object.freeze({
  API: "api",
  WEB: "web",
  MOBILE: "mobile",
  SYSTEM: "system",
  WORKER: "worker",
  CRON: "cron",
  IMPORT: "import",
  WEBHOOK: "webhook",
});

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: "in_app",
  PUSH: "push",
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
});

export const NOTIFICATION_STATUSES = Object.freeze({
  PENDING: "pending",
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
});

export const FILE_TYPES = Object.freeze({
  IMAGE: "image",
  DOCUMENT: "document",
  VIDEO: "video",
  AUDIO: "audio",
  SPREADSHEET: "spreadsheet",
  ARCHIVE: "archive",
  OTHER: "other",
});

export const SOFT_DELETE = Object.freeze({
  FIELD: "isDeleted",

  DATE_FIELD: "deletedAt",

  BY_FIELD: "deletedBy",
});

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const DEFAULT_LOCALE = "en-IN";

export const DEFAULT_CURRENCY = "INR";

export const DATABASE = Object.freeze({
  MAX_POOL_SIZE: 20,

  MIN_POOL_SIZE: 5,

  SERVER_SELECTION_TIMEOUT_MS: 5000,

  SOCKET_TIMEOUT_MS: 45000,

  CONNECT_TIMEOUT_MS: 10000,

  MAX_IDLE_TIME_MS: 30000,
});

export const SECURITY_HEADERS = Object.freeze({
  REQUEST_ID: "X-Request-Id",

  CORRELATION_ID: "X-Correlation-Id",

  API_VERSION: "X-API-Version",
});

export const HEALTH_STATUS = Object.freeze({
  HEALTHY: "healthy",

  DEGRADED: "degraded",

  UNHEALTHY: "unhealthy",
});

export const ENVIRONMENTS = Object.freeze({
  DEVELOPMENT: "development",

  TEST: "test",

  STAGING: "staging",

  PRODUCTION: "production",
});

export const HTTP_METHODS = Object.freeze([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

export const RESOURCE_ACTIONS = Object.freeze([
  "create",
  "read",
  "update",
  "delete",
  "list",
  "export",
  "import",
]);

export const CACHE = Object.freeze({
  DEFAULT_TTL_SECONDS: 300,

  SHORT_TTL_SECONDS: 60,

  LONG_TTL_SECONDS: 3600,
});

export const JOB_STATUS = Object.freeze({
  WAITING: "waiting",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  DELAYED: "delayed",
  CANCELLED: "cancelled",
});

export const RETRY = Object.freeze({
  DEFAULT_ATTEMPTS: 3,

  INITIAL_DELAY_MS: 1000,

  MAX_DELAY_MS: 60 * 60 * 1000,

  BACKOFF_MULTIPLIER: 2,
});

export const RESPONSE_MESSAGES = Object.freeze({
  SUCCESS: "Operation completed successfully",

  CREATED: "Resource created successfully",

  UPDATED: "Resource updated successfully",

  DELETED: "Resource deleted successfully",

  RESTORED: "Resource restored successfully",

  LOGIN_SUCCESS: "Login successful",

  LOGOUT_SUCCESS: "Logout successful",

  PASSWORD_CHANGED: "Password changed successfully",

  PASSWORD_RESET: "Password reset successfully",

  OTP_SENT: "OTP sent successfully",

  OTP_VERIFIED: "OTP verified successfully",
});

export default Object.freeze({
  APP_CONSTANTS,
  ROLES,
  ROLE_VALUES,
  USER_STATUSES,
  HTTP_STATUS,
  ERROR_CODES,
  AUTH,
  REQUEST,
  PAGINATION,
  SORT,
  ACCOUNT_SECURITY,
  PASSWORD,
  RATE_LIMIT,
  CONTENT_TYPES,
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  AUDIT_SEVERITIES,
  EVENT_STATUS,
  EVENT_SOURCES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  FILE_TYPES,
  SOFT_DELETE,
  DEFAULT_TIMEZONE,
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  DATABASE,
  SECURITY_HEADERS,
  HEALTH_STATUS,
  ENVIRONMENTS,
  HTTP_METHODS,
  RESOURCE_ACTIONS,
  CACHE,
  JOB_STATUS,
  RETRY,
  RESPONSE_MESSAGES,
});
