// server/src/services/authService.js

import crypto from "node:crypto";

import { User } from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";

import ApiError from "../utils/ApiError.js";

import {
  hashPassword,
  comparePassword,
  verifyAndMaybeRehashPassword,
} from "../utils/password.js";

import {
  generateRandomToken,
  hash,
} from "../utils/crypto.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import {
  set,
  get,
  del,
  cacheKey,
} from "../utils/redis.js";


// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const ACCESS_TOKEN_TTL = Number(
  process.env.ACCESS_TOKEN_TTL || 15 * 60
);

const REFRESH_TOKEN_TTL = Number(
  process.env.REFRESH_TOKEN_TTL ||
    30 * 24 * 60 * 60
);


// ─────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const normalizePhone = (phone) => {
  if (!phone) {
    return null;
  }

  return String(phone)
    .trim()
    .replace(/\s+/g, "");
};


// ─────────────────────────────────────────────
// SANITIZE USER
// ─────────────────────────────────────────────

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const source =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete source.password;
  delete source.passwordHash;
  delete source.refreshToken;
  delete source.accessToken;
  delete source.resetToken;
  delete source.resetTokenHash;
  delete source.emailVerificationToken;
  delete source.emailVerificationTokenHash;

  delete source.failedAttempts;
  delete source.lockedUntil;

  return source;
};


// ─────────────────────────────────────────────
// USER ROLES
// ─────────────────────────────────────────────

const getUserRoles = (user) => {
  if (user?.role) {
    return [user.role];
  }

  return [];
};


// ─────────────────────────────────────────────
// ACCESS TOKEN PAYLOAD
// ─────────────────────────────────────────────

const buildTokenPayload = (
  user,
  sessionId = null
) => {
  const payload = {
    sub: String(user._id),

    role: user.role,

    type: "access",

    instituteId: user.instituteId
      ? String(user.instituteId)
      : null,
  };

  if (sessionId) {
    payload.sid = String(sessionId);
  }

  return payload;
};


// ─────────────────────────────────────────────
// CREATE SESSION
// ─────────────────────────────────────────────

const createSession = async ({
  user,
  ipAddress = null,
  userAgent = null,
  deviceId = null,
  deviceName = null,
}) => {
const refreshToken = generateRandomToken(64);

const refreshTokenHash = hash(refreshToken);

const familyId = crypto.randomUUID();

const now = new Date();

const expiresAt = new Date(
  now.getTime() + REFRESH_TOKEN_TTL * 1000
);

const session = await RefreshSession.create({
  userId: user._id,

  familyId,

  tokenHash: refreshTokenHash,

  expiresAt,

  lastUsedAt: now,

  ip: ipAddress,

  userAgent,

  revokedAt: null,

  revokedReason: null,

  lastRotatedAt: null,
});

const sessionId = String(session._id);

const payload = buildTokenPayload(
  user,
  sessionId
);

  const accessToken =
    signAccessToken(
      payload
    );

  const signedRefreshToken =
    signRefreshToken({
      ...payload,

      tokenHash:
        refreshTokenHash,
    });

  await set(
    cacheKey.refreshSession(
      sessionId
    ),
    {
      userId: String(user._id),

      instituteId:
        user.instituteId
          ? String(
              user.instituteId
            )
          : null,

      tokenHash:
        refreshTokenHash,

      expiresAt:
        expiresAt.toISOString(),
    },

    REFRESH_TOKEN_TTL
  );

  return {
    session,

    accessToken,

    refreshToken:
      signedRefreshToken,

   sessionId: String(session._id),

    expiresAt,
  };
};


// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

const register = async ({
  email,
  phone,
  password,
  name,
  role,
  instituteId,
}) => {
  const normalizedEmail =
    normalizeEmail(email);

  const normalizedPhone =
    normalizePhone(phone);

  if (!normalizedEmail) {
    throw ApiError.badRequest(
      "Email is required",
      "EMAIL_REQUIRED"
    );
  }

  if (!password) {
    throw ApiError.badRequest(
      "Password is required",
      "PASSWORD_REQUIRED"
    );
  }

  const existingConditions = [
    {
      email:
        normalizedEmail,
    },
  ];

  if (normalizedPhone) {
    existingConditions.push({
      "profile.phone":
        normalizedPhone,
    });
  }

  const existingUser =
    await User.findOne({
      $or: existingConditions,
    }).select(
      "_id email profile.phone"
    );

  if (existingUser) {
    throw ApiError.conflict(
      "An account with these credentials already exists",
      "USER_ALREADY_EXISTS"
    );
  }

  const passwordHash =
    await hashPassword(
      password
    );
console.log("REGISTER INPUT:", {
  email,
  name,
  role,
  instituteId,
});
  const user =
    await User.create({
      email:
        normalizedEmail,

      profile: {
        phone:
          normalizedPhone,
      },

      name:
        name?.trim(),

      passwordHash,

      role:
        role ,

      instituteId:
        instituteId || null,
    });

    
  return sanitizeUser(
    user
  );
};


// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

const login = async ({
  email,
  password,
  ipAddress = null,
  userAgent = null,
  deviceId = null,
  deviceName = null,
}) => {
  const normalizedEmail =
    normalizeEmail(email);

  const user =
    await User.findOne({
      email:
        normalizedEmail,
    }).select(
      "+passwordHash +passwordChangedAt +status +instituteId"
    );

  if (!user) {
    throw ApiError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  if (
    user.isDeleted ||
    user.deletedAt
  ) {
    throw ApiError.unauthorized(
      "This account is no longer available",
      "ACCOUNT_DELETED"
    );
  }

  const normalizedStatus =
    String(
      user.status || "active"
    ).toLowerCase();

  if (
    ![
      "active",
      "verified",
    ].includes(
      normalizedStatus
    )
  ) {
    throw ApiError.unauthorized(
      "Your account is not active",
      "ACCOUNT_INACTIVE"
    );
  }

  if (!user.passwordHash) {
    throw ApiError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  const verification =
    await verifyAndMaybeRehashPassword(
      password,
      user.passwordHash
    );

  if (!verification.valid) {
    throw ApiError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  if (
    verification.rehashed
  ) {
    user.passwordHash =
      verification.passwordHash;

    await user.save();
  }

  const tokens =
    await createSession({
      user,

      ipAddress,

      userAgent,

      deviceId,

      deviceName,
    });

  return {
    user:
      sanitizeUser(user),

    accessToken:
      tokens.accessToken,

    refreshToken:
      tokens.refreshToken,

    sessionId:
      tokens.sessionId,

    expiresAt:
      tokens.expiresAt,
  };
};


// ─────────────────────────────────────────────
// REFRESH SESSION
// ─────────────────────────────────────────────

const refreshSession = async ({
  refreshToken,
  ipAddress = null,
  userAgent = null,
}) => {
  if (!refreshToken) {
    throw ApiError.unauthorized(
      "Refresh token is required",
      "REFRESH_TOKEN_REQUIRED"
    );
  }

  let payload;

  try {
    payload =
      verifyRefreshToken(
        refreshToken
      );
  } catch {
    throw ApiError.unauthorized(
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN"
    );
  }

  if (!payload?.sub) {
    throw ApiError.unauthorized(
      "Invalid refresh token",
      "INVALID_REFRESH_TOKEN"
    );
  }

  const sessionId =
    payload.sid;

  if (!sessionId) {
    throw ApiError.unauthorized(
      "Refresh session is invalid",
      "INVALID_REFRESH_SESSION"
    );
  }

  const tokenHash =
    hash(refreshToken);

  const cachedSession =
    await get(
      cacheKey.refreshSession(
        sessionId
      )
    );

  const session =
    await RefreshSession.findOne({
      _id: sessionId,

      userId: payload.sub,

      revoked: {
        $ne: true,
      },
    });

  if (!session) {
    throw ApiError.unauthorized(
      "Refresh session is no longer valid",
      "REFRESH_SESSION_INVALID"
    );
  }

  if (
    session.expiresAt <=
    new Date()
  ) {
    session.revoked =
      true;

    session.revokedAt =
      new Date();

    session.revocationReason =
      "expired";

    await session.save();

    await del(
      cacheKey.refreshSession(
        sessionId
      )
    );

    throw ApiError.unauthorized(
      "Refresh session has expired",
      "REFRESH_SESSION_EXPIRED"
    );
  }

  // Database token hash is
  // authoritative.
  if (
    session.tokenHash !==
    tokenHash
  ) {
    session.revoked =
      true;

    session.revokedAt =
      new Date();

    session.revocationReason =
      "token_reuse";

    await session.save();

    await del(
      cacheKey.refreshSession(
        sessionId
      )
    );

    throw ApiError.unauthorized(
      "Refresh token is invalid",
      "REFRESH_TOKEN_REUSE_DETECTED"
    );
  }

  // If Redis has a cached session,
  // make sure it agrees with MongoDB.
  if (
    cachedSession?.tokenHash &&
    cachedSession.tokenHash !==
      tokenHash
  ) {
    throw ApiError.unauthorized(
      "Refresh token is invalid",
      "REFRESH_TOKEN_INVALIDATED"
    );
  }

  const user =
    await User.findById(
      payload.sub
    ).select(
      "+passwordChangedAt +status +instituteId"
    );

  if (!user) {
    throw ApiError.unauthorized(
      "User account not found",
      "USER_NOT_FOUND"
    );
  }

  if (
    user.isDeleted ||
    user.deletedAt
  ) {
    throw ApiError.unauthorized(
      "User account has been deleted",
      "ACCOUNT_DELETED"
    );
  }

  const normalizedStatus =
    String(
      user.status || "active"
    ).toLowerCase();

  if (
    ![
      "active",
      "verified",
    ].includes(
      normalizedStatus
    )
  ) {
    throw ApiError.unauthorized(
      "User account is not active",
      "ACCOUNT_INACTIVE"
    );
  }

  // Rotate refresh token.
  const newRefreshToken =
    generateRandomToken(64);

  const newTokenHash =
    hash(
      newRefreshToken
    );

  const newExpiresAt =
    new Date(
      Date.now() +
        REFRESH_TOKEN_TTL *
          1000
    );

  session.tokenHash =
    newTokenHash;

  session.expiresAt =
    newExpiresAt;

  session.lastUsedAt =
    new Date();

  if (ipAddress) {
    session.ipAddress =
      ipAddress;
  }

  if (userAgent) {
    session.userAgent =
      userAgent;
  }

  await session.save();

  const newPayload =
    buildTokenPayload(
      user,
      sessionId
    );

  const accessToken =
    signAccessToken(
      newPayload
    );

  const signedRefreshToken =
    signRefreshToken({
      ...newPayload,

      tokenHash:
        newTokenHash,
    });

  await set(
    cacheKey.refreshSession(
      sessionId
    ),
    {
      userId:
        String(user._id),

      instituteId:
        user.instituteId
          ? String(
              user.instituteId
            )
          : null,

      tokenHash:
        newTokenHash,

      expiresAt:
        newExpiresAt.toISOString(),
    },

    REFRESH_TOKEN_TTL
  );

  return {
    user:
      sanitizeUser(user),

    accessToken,

    refreshToken:
      signedRefreshToken,

    sessionId,

    expiresAt:
      newExpiresAt,
  };
};


// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

const logout = async ({
  userId,
  sessionId,
}) => {
  if (!userId) {
    throw ApiError.unauthorized(
      "Authentication required",
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!sessionId) {
    return {
      success: true,
    };
  }

  const session =
    await RefreshSession.findOne({
      _id: sessionId,

      userId,
    });

  if (session) {
    session.revoked =
      true;

    session.revokedAt =
      new Date();

    session.revocationReason =
      "logout";

    await session.save();
  }

  await del(
    cacheKey.refreshSession(
      sessionId
    )
  );

  return {
    success: true,
  };
};


// ─────────────────────────────────────────────
// LOGOUT ALL
// ─────────────────────────────────────────────

const logoutAll = async ({
  userId,
}) => {
  if (!userId) {
    throw ApiError.unauthorized(
      "Authentication required",
      "AUTHENTICATION_REQUIRED"
    );
  }

  await RefreshSession.updateMany(
    {
      userId,

      revoked: {
        $ne: true,
      },
    },
    {
      $set: {
        revoked: true,

        revokedAt:
          new Date(),

        revocationReason:
          "logout_all",
      },
    }
  );

  const sessions =
    await RefreshSession.find({
      userId,
    }).select("_id");

  await Promise.all(
    sessions.map(
      (session) =>
        del(
          cacheKey.refreshSession(
            session._id
          )
        )
    )
  );

  return {
    success: true,
  };
};


// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export {
  normalizeEmail,
  normalizePhone,
  sanitizeUser,
  getUserRoles,
  buildTokenPayload,
  createSession,
  register,
  login,
  refreshSession,
  logout,
  logoutAll,
};

export default {
  register,
  login,
  refreshSession,
  logout,
  logoutAll,
};