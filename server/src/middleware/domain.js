// server/src/middleware/domain.js

import { AppError } from "../utils/errorHandler.js";
import { ROLES } from "../config/constants.js";
import Organization from "../models/organization.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeDomains = (domains = []) =>
  domains
    .flat()
    .filter(Boolean)
    .map((domain) =>
      String(domain)
        .trim()
        .toLowerCase()
    );

const getUserRole = (req) =>
  String(req.user?.role || "")
    .trim()
    .toLowerCase();

/* -------------------------------------------------------------------------- */
/* Resolve Organization                                                       */
/* -------------------------------------------------------------------------- */

const getUserOrganization = async (req) => {
  if (!req.user?.instituteId) {
    return null;
  }

  return Organization.findOne({
    _id: req.user.instituteId,
    isDeleted: false,
  })
    .select("_id type status")
    .lean();
};

/* -------------------------------------------------------------------------- */
/* Allowed Organization Domains                                               */
/* -------------------------------------------------------------------------- */

const allowDomains = (...allowedTypes) => {
  const allowedDomains = normalizeDomains(allowedTypes);

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new AppError(
            "Authentication required",
            401,
            "UNAUTHORIZED"
          )
        );
      }

      const userRole = getUserRole(req);

      /* Super admin is global and is not restricted by organization type */
      if (userRole === ROLES.SUPER_ADMIN) {
        return next();
      }

      if (allowedDomains.length === 0) {
        return next(
          new AppError(
            "No domains configured for this policy",
            500,
            "DOMAIN_POLICY_INVALID"
          )
        );
      }

      if (!req.user.instituteId) {
        return next(
          new AppError(
            "User organization not found",
            403,
            "ORGANIZATION_NOT_FOUND"
          )
        );
      }

      const organization =
        await getUserOrganization(req);

      if (!organization) {
        return next(
          new AppError(
            "User organization not found",
            403,
            "ORGANIZATION_NOT_FOUND"
          )
        );
      }

      if (organization.status !== "active") {
        return next(
          new AppError(
            "Organization is not active",
            403,
            "ORGANIZATION_INACTIVE"
          )
        );
      }

      const organizationType =
        String(organization.type || "")
          .trim()
          .toLowerCase();

      if (
        !allowedDomains.includes(
          organizationType
        )
      ) {
        return next(
          new AppError(
            "You do not have access to this resource",
            403,
            "DOMAIN_FORBIDDEN"
          )
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/* -------------------------------------------------------------------------- */
/* Require Organization                                                       */
/* -------------------------------------------------------------------------- */

const requireDomain = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required",
          401,
          "UNAUTHORIZED"
        )
      );
    }

    const userRole = getUserRole(req);

    /* Super admin is global */
    if (userRole === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!req.user.instituteId) {
      return next(
        new AppError(
          "User organization not found",
          403,
          "ORGANIZATION_NOT_FOUND"
        )
      );
    }

    const organization =
      await getUserOrganization(req);

    if (!organization) {
      return next(
        new AppError(
          "User organization not found",
          403,
          "ORGANIZATION_NOT_FOUND"
        )
      );
    }

    if (organization.status !== "active") {
      return next(
        new AppError(
          "Organization is not active",
          403,
          "ORGANIZATION_INACTIVE"
        )
      );
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export {
  allowDomains,
  requireDomain,
};