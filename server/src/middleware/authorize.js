// server/src/middleware/authorize.js

import ApiError from "../utils/ApiError.js";

import {
  normalizeRole,
  hasAnyRole,
  hasAllRoles,
  hasMinimumRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageRole,
} from "../utils/permissions.js";

/* =========================================================
   AUTHENTICATED ROLES
========================================================= */

const getAuthenticatedRoles = (req) => {
  if (Array.isArray(req.auth?.roles)) {
    return req.auth.roles
      .map(normalizeRole)
      .filter(Boolean);
  }

  if (req.user?.role) {
    return [
      normalizeRole(req.user.role),
    ].filter(Boolean);
  }

  if (Array.isArray(req.user?.roles)) {
    return req.user.roles
      .map(normalizeRole)
      .filter(Boolean);
  }

  return [];
};

/* =========================================================
   AUTHENTICATED PERMISSIONS
========================================================= */

const getAuthenticatedPermissions = (req) => {
  if (Array.isArray(req.auth?.permissions)) {
    return req.auth.permissions.filter(Boolean);
  }

  if (Array.isArray(req.user?.permissions)) {
    return req.user.permissions.filter(Boolean);
  }

  return [];
};

/* =========================================================
   AUTHENTICATION GUARD
========================================================= */

const ensureAuthenticated = (req) => {
  if (!req.user || !req.auth) {
    throw ApiError.unauthorized(
      "Authentication required",
      "AUTHENTICATION_REQUIRED"
    );
  }
};

/* =========================================================
   REQUIRE ANY ROLE
========================================================= */

const requireRole = (...allowedRoles) => {
  const roles = allowedRoles
    .flat()
    .map(normalizeRole)
    .filter(Boolean);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (roles.length === 0) {
        throw ApiError.forbidden(
          "No roles are configured for this resource",
          "ROLE_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      if (
        !hasAnyRole(
          userRoles,
          roles
        )
      ) {
        throw ApiError.forbidden(
          "You do not have permission to perform this action",
          "ROLE_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   REQUIRE ALL ROLES
========================================================= */

const requireAllRoles = (...requiredRoles) => {
  const roles = requiredRoles
    .flat()
    .map(normalizeRole)
    .filter(Boolean);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (roles.length === 0) {
        throw ApiError.forbidden(
          "No roles are configured for this resource",
          "ROLE_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      if (
        !hasAllRoles(
          userRoles,
          roles
        )
      ) {
        throw ApiError.forbidden(
          "You do not have the required roles",
          "ROLE_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   MINIMUM ROLE
========================================================= */

const requireMinimumRole = (
  minimumRole
) => {
  const role =
    normalizeRole(minimumRole);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (!role) {
        throw ApiError.forbidden(
          "Minimum role is not configured",
          "ROLE_HIERARCHY_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      if (
        !hasMinimumRole(
          userRoles,
          role
        )
      ) {
        throw ApiError.forbidden(
          "Your role does not have sufficient authority for this action",
          "ROLE_HIERARCHY_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   REQUIRE ALL PERMISSIONS
========================================================= */

const requirePermission = (
  ...requiredPermissions
) => {
  const permissions =
    requiredPermissions
      .flat()
      .filter(Boolean);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (permissions.length === 0) {
        throw ApiError.forbidden(
          "No permissions are configured for this resource",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      const userPermissions =
        getAuthenticatedPermissions(req);

      const hasAccess =
        permissions.length === 1
          ? hasPermission(
              userRoles,
              permissions[0],
              userPermissions
            )
          : hasAllPermissions(
              userRoles,
              permissions,
              userPermissions
            );

      if (!hasAccess) {
        throw ApiError.forbidden(
          "You do not have the required permission",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   REQUIRE ANY PERMISSION
========================================================= */

const requireAnyPermission = (
  ...requiredPermissions
) => {
  const permissions =
    requiredPermissions
      .flat()
      .filter(Boolean);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (permissions.length === 0) {
        throw ApiError.forbidden(
          "No permissions are configured for this resource",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      const userPermissions =
        getAuthenticatedPermissions(req);

      if (
        !hasAnyPermission(
          userRoles,
          permissions,
          userPermissions
        )
      ) {
        throw ApiError.forbidden(
          "You do not have any of the required permissions",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   REQUIRE ALL PERMISSIONS
========================================================= */

const requireAllPermissions = (
  ...requiredPermissions
) => {
  const permissions =
    requiredPermissions
      .flat()
      .filter(Boolean);

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      if (permissions.length === 0) {
        throw ApiError.forbidden(
          "No permissions are configured for this resource",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      const userRoles =
        getAuthenticatedRoles(req);

      const userPermissions =
        getAuthenticatedPermissions(req);

      if (
        !hasAllPermissions(
          userRoles,
          permissions,
          userPermissions
        )
      ) {
        throw ApiError.forbidden(
          "You do not have all the required permissions",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   PREVENT / CONTROL ROLE MANAGEMENT
========================================================= */

const preventRoleManagement = (
  targetRoleResolver
) => {
  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      const actorRoles =
        getAuthenticatedRoles(req);

      const targetRole =
        typeof targetRoleResolver === "function"
          ? targetRoleResolver(req)
          : targetRoleResolver;

      const normalizedTargetRole =
        normalizeRole(targetRole);

      if (!normalizedTargetRole) {
        throw ApiError.badRequest(
          "Target role is required",
          "TARGET_ROLE_REQUIRED"
        );
      }

      const canManage =
        actorRoles.some(
          (actorRole) =>
            canManageRole(
              actorRole,
              normalizedTargetRole
            )
        );

      if (!canManage) {
        throw ApiError.forbidden(
          "You are not allowed to manage this role",
          "ROLE_MANAGEMENT_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   GENERAL AUTHORIZE
========================================================= */

const authorize = ({
  roles = [],
  permissions = [],
  anyPermissions = [],
  minimumRole = null,
} = {}) => {
  const normalizedRoles =
    (
      Array.isArray(roles)
        ? roles
        : [roles]
    )
      .flat()
      .map(normalizeRole)
      .filter(Boolean);

  const normalizedPermissions =
    (
      Array.isArray(permissions)
        ? permissions
        : [permissions]
    )
      .flat()
      .filter(Boolean);

  const normalizedAnyPermissions =
    (
      Array.isArray(anyPermissions)
        ? anyPermissions
        : [anyPermissions]
    )
      .flat()
      .filter(Boolean);

  const normalizedMinimumRole =
    minimumRole
      ? normalizeRole(minimumRole)
      : null;

  return (req, res, next) => {
    try {
      ensureAuthenticated(req);

      const userRoles =
        getAuthenticatedRoles(req);

      const userPermissions =
        getAuthenticatedPermissions(req);

      /* ---------------------------------------------
         ROLE CHECK
      --------------------------------------------- */

      if (
        normalizedRoles.length > 0 &&
        !hasAnyRole(
          userRoles,
          normalizedRoles
        )
      ) {
        throw ApiError.forbidden(
          "You do not have the required role",
          "ROLE_ACCESS_DENIED"
        );
      }

      /* ---------------------------------------------
         MINIMUM ROLE CHECK
      --------------------------------------------- */

      if (
        normalizedMinimumRole &&
        !hasMinimumRole(
          userRoles,
          normalizedMinimumRole
        )
      ) {
        throw ApiError.forbidden(
          "Your role does not have sufficient authority",
          "ROLE_HIERARCHY_ACCESS_DENIED"
        );
      }

      /* ---------------------------------------------
         ALL PERMISSIONS CHECK
      --------------------------------------------- */

      if (
        normalizedPermissions.length > 0 &&
        !hasAllPermissions(
          userRoles,
          normalizedPermissions,
          userPermissions
        )
      ) {
        throw ApiError.forbidden(
          "You do not have all the required permissions",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      /* ---------------------------------------------
         ANY PERMISSION CHECK
      --------------------------------------------- */

      if (
        normalizedAnyPermissions.length > 0 &&
        !hasAnyPermission(
          userRoles,
          normalizedAnyPermissions,
          userPermissions
        )
      ) {
        throw ApiError.forbidden(
          "You do not have any of the required permissions",
          "PERMISSION_ACCESS_DENIED"
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* =========================================================
   EXPORTS
========================================================= */

export {
  getAuthenticatedRoles,
  getAuthenticatedPermissions,
  requireRole,
  requireAllRoles,
  requireMinimumRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  preventRoleManagement,
  authorize,
};

export default authorize;