// server/src/middleware/authenticate.js

import ApiError from "../utils/ApiError.js";

import {
  extractAccessToken,
  verifyAccessToken,
} from "../utils/jwt.js";
import Organization from "../models/organization.js";
import { get } from "../utils/redis.js";

import { User } from "../models/User.js";
import { ROLES } from "../config/constants.js";
const authenticate = async (
  req,
  res,
  next
) => {
  try {
    // ─────────────────────────────────────────────
    // EXTRACT ACCESS TOKEN
    // ─────────────────────────────────────────────

    const extracted =
      extractAccessToken(req);

    const token =
      extracted?.token;

    if (!token) {
      throw ApiError.unauthorized(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    // ─────────────────────────────────────────────
    // VERIFY ACCESS TOKEN
    // ─────────────────────────────────────────────

    let payload;

    try {
      payload =
        verifyAccessToken(token);
    } catch (error) {
      if (
        error?.name ===
        "TokenExpiredError"
      ) {
        throw ApiError.unauthorized(
          "Access token has expired",
          "ACCESS_TOKEN_EXPIRED"
        );
      }

      throw ApiError.unauthorized(
        "Invalid access token",
        "INVALID_ACCESS_TOKEN"
      );
    }

    if (!payload?.sub) {
      throw ApiError.unauthorized(
        "Invalid authentication token",
        "INVALID_ACCESS_TOKEN"
      );
    }

    // ─────────────────────────────────────────────
    // TOKEN TYPE
    // ─────────────────────────────────────────────

    if (
      payload.type &&
      payload.type !== "access"
    ) {
      throw ApiError.unauthorized(
        "Invalid token type",
        "INVALID_TOKEN_TYPE"
      );
    }

    // ─────────────────────────────────────────────
    // REVOKED TOKEN
    // ─────────────────────────────────────────────

    if (payload.jti) {
      const revoked =
        await get(
          `paisa:auth:revoked:${payload.jti}`
        );

      if (revoked) {
        throw ApiError.unauthorized(
          "Authentication session has been revoked",
          "TOKEN_REVOKED"
        );
      }
    }

    // ─────────────────────────────────────────────
    // LOAD CURRENT USER
    // ─────────────────────────────────────────────

    const user =
      await User.findById(
        payload.sub
      )
        .select(
          "_id publicId name email role status " +
          "instituteId userCode isDeleted " +
          "deletedAt passwordChangedAt"
        )
        .lean();

    if (!user) {
      throw ApiError.unauthorized(
        "User account not found",
        "USER_NOT_FOUND"
      );
    }

    // ─────────────────────────────────────────────
    // DELETED ACCOUNT
    // ─────────────────────────────────────────────

    if (
      user.isDeleted ||
      user.deletedAt
    ) {
      throw ApiError.unauthorized(
        "User account has been deleted",
        "ACCOUNT_DELETED"
      );
    }

    // ─────────────────────────────────────────────
    // ACCOUNT STATUS
    // ─────────────────────────────────────────────

    const status =
      String(
        user.status || "active"
      ).toLowerCase();

    if (
      status !== "active"
    ) {
      throw ApiError.unauthorized(
        "User account is not active",
        "ACCOUNT_INACTIVE"
      );
    }

    // ─────────────────────────────────────────────
    // ORGANIZATION STATUS
    // ─────────────────────────────────────────────

    if (user.role !== ROLES.SUPER_ADMIN) {
      if (!user.instituteId) {
        throw ApiError.unauthorized(
          "User organization not found",
          "ORGANIZATION_NOT_FOUND"
        );
      }

      const organization =
        await Organization.findOne({
          _id: user.instituteId,
          isDeleted: false,
        })
          .select("_id type status")
          .lean();

      if (!organization) {
        throw ApiError.unauthorized(
          "User organization not found",
          "ORGANIZATION_NOT_FOUND"
        );
      }

      if (organization.status !== "active") {
        throw ApiError.unauthorized(
          "User organization is not active",
          "ORGANIZATION_INACTIVE"
        );
      }
    }

    // ─────────────────────────────────────────────
    // PASSWORD CHANGE INVALIDATION
    // ─────────────────────────────────────────────

    if (
      payload.iat &&
      user.passwordChangedAt
    ) {
      const passwordChangedAt =
        new Date(
          user.passwordChangedAt
        ).getTime() / 1000;

      if (
        passwordChangedAt >
        Number(payload.iat)
      ) {
        throw ApiError.unauthorized(
          "Authentication token is no longer valid",
          "TOKEN_INVALIDATED"
        );
      }
    }

    // ─────────────────────────────────────────────
    // REQUEST USER
    // ─────────────────────────────────────────────

    req.user = user;

    // ─────────────────────────────────────────────
    // AUTH CONTEXT
    // ─────────────────────────────────────────────

    req.auth = {
      userId:
        String(user._id),

      publicId:
        user.publicId || null,

      instituteId:
        user.instituteId
          ? String(
              user.instituteId
            )
          : null,

      role:
        user.role,

      // Keep this for authorize.js
      // compatibility.
      roles:
        user.role
          ? [user.role]
          : [],

      tokenId:
        payload.jti || null,

      sessionId:
        payload.sid || null,

      issuedAt:
        payload.iat
          ? new Date(
              Number(
                payload.iat
              ) * 1000
            )
          : null,

      expiresAt:
        payload.exp
          ? new Date(
              Number(
                payload.exp
              ) * 1000
            )
          : null,

      tokenSource:
        extracted.source ||
        null,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authenticate;