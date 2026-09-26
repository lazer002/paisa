// server/src/middleware/domain.js

import { AppError } from "../utils/errorHandler.js";
import { Roles } from "../models/user.js";

const normalizeDomains = (domains) =>
  domains
    .flat()
    .filter(Boolean)
    .map((domain) => String(domain).trim().toLowerCase());

const allowDomains = (...allowedTypes) => {
  const allowedDomains = normalizeDomains(allowedTypes);

  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required",
          401,
          "UNAUTHORIZED"
        )
      );
    }

    if (req.user.role === Roles.SUPER_ADMIN) {
      return next();
    }

    if (!req.user.domain) {
      return next(
        new AppError(
          "User organization domain not found",
          403,
          "DOMAIN_NOT_FOUND"
        )
      );
    }

    const userDomain = String(req.user.domain)
      .trim()
      .toLowerCase();

    if (!allowedDomains.includes(userDomain)) {
      return next(
        new AppError(
          "You do not have access to this resource",
          403,
          "DOMAIN_FORBIDDEN"
        )
      );
    }

    return next();
  };
};

const requireDomain = (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError(
        "Authentication required",
        401,
        "UNAUTHORIZED"
      )
    );
  }

  if (req.user.role === Roles.SUPER_ADMIN) {
    return next();
  }

  if (!req.user.domain) {
    return next(
      new AppError(
        "User organization domain not found",
        403,
        "DOMAIN_NOT_FOUND"
      )
    );
  }

  return next();
};

export {
  allowDomains,
  requireDomain,
};