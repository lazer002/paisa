// server/src/middleware/auth.js

import jwt from "jsonwebtoken";
import crypto from "crypto";

import { User, RolePermissions, Roles } from "../models/user.js";
import Organization from "../models/organization.js";
import { AppError } from "../utils/errorHandler.js";

const JWT_ALGORITHM = "HS256";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET is missing or too short. JWT_SECRET must contain at least 32 characters."
  );
}

/* -------------------------------------------------------------------------- */
/* Token helpers                                                               */
/* -------------------------------------------------------------------------- */

const signAccessToken = (user) => {
  if (!user?._id || !user?.role) {
    throw new TypeError("User identity and role are required");
  }

  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      type: "access",
    },
    JWT_SECRET,
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: process.env.JWT_ACCESS_TTL || "15m",
      issuer: process.env.JWT_ISSUER || "paisa-api",
      audience: process.env.JWT_AUDIENCE || "paisa-client",
    }
  );
};

const generateRefreshToken = () =>
  crypto.randomBytes(48).toString("hex");

const hashToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") {
    throw new TypeError("Token must be a non-empty string");
  }

  return crypto
    .createHash("sha256")
    .update(rawToken, "utf8")
    .digest("hex");
};

const extractAccessToken = (req) => {
  const cookieToken = req.cookies?.token;

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = req.headers?.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, credentials] = authorization.trim().split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !credentials
  ) {
    return null;
  }

  return credentials;
};

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new AppError(
        "Authentication required",
        401,
        "UNAUTHORIZED"
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: process.env.JWT_ISSUER || "paisa-api",
        audience: process.env.JWT_AUDIENCE || "paisa-client",
      });
    } catch (error) {
      if (error?.name === "TokenExpiredError") {
        throw new AppError(
          "Session expired, please log in again",
          401,
          "TOKEN_EXPIRED"
        );
      }

      if (error?.name === "JsonWebTokenError") {
        throw new AppError(
          "Invalid authentication token",
          401,
          "INVALID_TOKEN"
        );
      }

      throw error;
    }

    if (
      !decoded ||
      decoded.type !== "access" ||
      !decoded.sub
    ) {
      throw new AppError(
        "Invalid authentication token",
        401,
        "INVALID_TOKEN"
      );
    }

    const user = await User.findById(decoded.sub)
      .select(
        [
          "_id",
          "name",
          "email",
          "role",
          "status",
          "instituteId",
          "userCode",
        ].join(" ")
      )
      .lean();

    if (!user) {
      throw new AppError(
        "User account not found",
        401,
        "USER_NOT_FOUND"
      );
    }

    if (user.status !== "active") {
      throw new AppError(
        "Account is inactive. Contact your administrator",
        403,
        "ACCOUNT_INACTIVE"
      );
    }

    /*
     * Token role is intentionally NOT trusted.
     * Authorization always uses the role currently stored in MongoDB.
     */

    if (user.instituteId) {
      const organization = await Organization.findById(
        user.instituteId
      )
        .select("_id type name status")
        .lean();

      if (!organization) {
        throw new AppError(
          "Organization not found",
          403,
          "ORGANIZATION_NOT_FOUND"
        );
      }

      if (
        organization.status &&
        organization.status !== "active"
      ) {
        throw new AppError(
          "Organization is inactive",
          403,
          "ORGANIZATION_INACTIVE"
        );
      }

      user.domain = organization.type;
      user.orgName = organization.name;
      user.organization = {
        _id: organization._id,
        type: organization.type,
        name: organization.name,
      };
    }

    req.user = user;
    req.auth = {
      userId: user._id,
      role: user.role,
      instituteId: user.instituteId || null,
      isSuperAdmin: user.role === Roles.SUPER_ADMIN,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* Role authorization                                                         */
/* -------------------------------------------------------------------------- */

const allowRoles = (...roles) => {
  const allowedRoles = roles.flat().filter(Boolean);

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

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "Access denied",
          403,
          "FORBIDDEN"
        )
      );
    }

    return next();
  };
};

/* -------------------------------------------------------------------------- */
/* Permission authorization                                                   */
/* -------------------------------------------------------------------------- */

const authorize = (...permissions) => {
  const requiredPermissions = permissions
    .flat()
    .filter(Boolean);

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

    if (!requiredPermissions.length) {
      return next(
        new AppError(
          "No permissions configured for this resource",
          403,
          "FORBIDDEN"
        )
      );
    }

    const userPermissions =
      RolePermissions?.[req.user.role] || [];

    const hasPermission = requiredPermissions.some(
      (permission) =>
        userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new AppError(
          "Insufficient permissions",
          403,
          "INSUFFICIENT_PERMISSIONS"
        )
      );
    }

    return next();
  };
};

/* -------------------------------------------------------------------------- */
/* Organization / tenant authorization                                        */
/* -------------------------------------------------------------------------- */

const requireInstitute = (req, res, next) => {
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

  if (!req.user.instituteId) {
    return next(
      new AppError(
        "Organization context is required",
        403,
        "INSTITUTE_REQUIRED"
      )
    );
  }

  return next();
};

/* -------------------------------------------------------------------------- */
/* Convenience middleware                                                     */
/* -------------------------------------------------------------------------- */

const isSuperAdmin = allowRoles(Roles.SUPER_ADMIN);
const isAdmin = allowRoles(Roles.ADMIN);
const isTeacher = allowRoles(Roles.TEACHER);
const isStudent = allowRoles(Roles.STUDENT);
const isHR = allowRoles(Roles.HR);
const isEmployee = allowRoles(Roles.EMPLOYEE);

export {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  extractAccessToken,

  authMiddleware,
  allowRoles,
  authorize,
  requireInstitute,

  isSuperAdmin,
  isAdmin,
  isTeacher,
  isStudent,
  isHR,
  isEmployee,
};