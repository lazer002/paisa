// server/src/middleware/index.js

export { default as requestId } from "./requestId.js";

export { default as authenticate } from "./authenticate.js";

export {
  default as authorize,
  requireRole,
  requireAllRoles,
  requireMinimumRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  preventRoleManagement,
} from "./authorize.js";

export {
  default as tenant,
  tenantMiddleware,
  requireTenant,
  optionalTenant,
  getTenantId,
  assertTenantAccess,
} from "./tenant.js";

export {
  default as validate,
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
  validateCookies,
  validateRequest,
  validateSource,
  commonSchemas,
} from "./validate.js";

export {
  default as rateLimiter,
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
} from "./rateLimiter.js";

export {
  default as audit,
  auditMiddleware,
  createAuditEntry,
} from "./audit.js";

export {
  default as security,
  securityHeaders,
  corsOptions,
  helmetOptions,
} from "./security.js";

export {
  default as responseMethods,
  sendSuccess,
  sendCreated,
  sendAccepted,
  sendNoContent,
  sendPaginated,
  sendError,
  sendForbidden,
  sendNotFound,
} from "../utils/response.js";

export {
  default as errorHandler,
  notFoundHandler,
} from "../utils/errorHandler.js";
