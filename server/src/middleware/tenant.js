// server/src/middleware/tenant.js

import mongoose from "mongoose";

import crypto from "node:crypto";import ApiError from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";

const getUserRoles = (req) => {
  if (Array.isArray(req.auth?.roles)) {
    return req.auth.roles;
  }

  if (Array.isArray(req.user?.roles)) {
    return req.user.roles;
  }

  if (req.user?.role) {
    return [req.user.role];
  }

  return [];
};

const isSuperAdmin = (req) => {
  return getUserRoles(req).includes(
    ROLES.SUPER_ADMIN
  );
};

const extractInstituteId = (req) => {
  return (
    req.params?.instituteId ||
    req.params?.organizationId ||
    req.body?.instituteId ||
    req.body?.organizationId ||
    req.query?.instituteId ||
    req.query?.organizationId ||
    req.headers["x-institute-id"] ||
    req.headers["x-organization-id"] ||
    req.user?.instituteId ||
    req.auth?.instituteId ||
    null
  );
};

const validateObjectId = (value) => {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
};

const tenantMiddleware = ({
  allowSuperAdmin = true,
  required = true,
  allowHeader = true,
  allowBody = true,
  allowQuery = true,
  allowParams = true,
} = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.auth) {
        throw ApiError.unauthorized(
          "Authentication required",
          "AUTHENTICATION_REQUIRED"
        );
      }

      const roles = getUserRoles(req);
      const superAdmin = roles.includes(
        ROLES.SUPER_ADMIN
      );

      if (
        superAdmin &&
        allowSuperAdmin
      ) {
        req.tenant = {
          instituteId:
            extractInstituteId(req),
          isSuperAdmin: true,
          bypass: true,
        };

        return next();
      }

      let instituteId = null;

      if (allowParams) {
        instituteId =
          req.params?.instituteId ||
          req.params?.organizationId ||
          null;
      }

      if (!instituteId && allowBody) {
        instituteId =
          req.body?.instituteId ||
          req.body?.organizationId ||
          null;
      }

      if (!instituteId && allowQuery) {
        instituteId =
          req.query?.instituteId ||
          req.query?.organizationId ||
          null;
      }

      if (!instituteId && allowHeader) {
        instituteId =
          req.headers["x-institute-id"] ||
          req.headers["x-organization-id"] ||
          null;
      }

      if (!instituteId) {
        instituteId =
          req.user?.instituteId ||
          req.auth?.instituteId ||
          null;
      }

      if (!instituteId) {
        if (!required) {
          req.tenant = {
            instituteId: null,
            isSuperAdmin: false,
            bypass: false,
          };

          return next();
        }

        throw ApiError.badRequest(
          "Institute ID is required",
          "INSTITUTE_ID_REQUIRED"
        );
      }

      if (!validateObjectId(instituteId)) {
        throw ApiError.badRequest(
          "Invalid institute ID",
          "INVALID_INSTITUTE_ID"
        );
      }

      const authenticatedInstituteId =
        req.user?.instituteId ||
        req.auth?.instituteId ||
        null;

      if (
        authenticatedInstituteId &&
        String(authenticatedInstituteId) !==
          String(instituteId)
      ) {
        throw ApiError.forbidden(
          "You do not have access to this institute",
          "INSTITUTE_ACCESS_DENIED"
        );
      }

      req.tenant = {
        instituteId: String(instituteId),
        isSuperAdmin: false,
        bypass: false,
      };

      req.instituteId = String(
        instituteId
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireTenant = tenantMiddleware({
  required: true,
});

const optionalTenant = tenantMiddleware({
  required: false,
});

const getTenantId = (req) => {
  return (
    req.tenant?.instituteId ||
    req.instituteId ||
    req.user?.instituteId ||
    req.auth?.instituteId ||
    null
  );
};

const assertTenantAccess = (
  req,
  instituteId
) => {
  if (!instituteId) {
    throw ApiError.badRequest(
      "Institute ID is required",
      "INSTITUTE_ID_REQUIRED"
    );
  }

  if (!validateObjectId(instituteId)) {
    throw ApiError.badRequest(
      "Invalid institute ID",
      "INVALID_INSTITUTE_ID"
    );
  }

  if (isSuperAdmin(req)) {
    return true;
  }

  const authenticatedInstituteId =
    getTenantId(req);

  if (
    !authenticatedInstituteId ||
    String(authenticatedInstituteId) !==
      String(instituteId)
  ) {
    throw ApiError.forbidden(
      "You do not have access to this institute",
      "INSTITUTE_ACCESS_DENIED"
    );
  }

  return true;
};

export {
  getUserRoles,
  isSuperAdmin,
  extractInstituteId,
  validateObjectId,
  tenantMiddleware,
  requireTenant,
  optionalTenant,
  getTenantId,
  assertTenantAccess,
};

export default tenantMiddleware;
