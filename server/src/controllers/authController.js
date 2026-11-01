// server/src/controllers/authController.js

import authService from "../services/authService.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import { User } from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";
import logger from "../config/logger.js";
import {
  FORGOT_PASSWORD_MESSAGE,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../services/passwordResetService.js";
import { sendInBackground } from "../services/emailService.js";
import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";

import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../utils/response.js";

/* =========================================================
   REQUEST HELPERS
========================================================= */

const getRequestIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
};

const getUserAgent = (req) => {
  return req.get?.("user-agent") || null;
};

const getDeviceId = (req) => {
  return (
    req.body?.deviceId ||
    req.headers?.["x-device-id"] ||
    null
  );
};

const getDeviceName = (req) => {
  return (
    req.body?.deviceName ||
    req.headers?.["x-device-name"] ||
    null
  );
};

/* =========================================================
   REFRESH TOKEN
========================================================= */

const getRefreshToken = (req) => {
  return (
    req.cookies?.[
      process.env.REFRESH_TOKEN_COOKIE ||
        "paisa_refresh_token"
    ] ||
    req.body?.refreshToken ||
    null
  );
};

/* =========================================================
   COOKIE OPTIONS
========================================================= */

const getCookieOptions = () => ({
  httpOnly:
    process.env.COOKIE_HTTP_ONLY !== "false",

  secure:
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true",

  sameSite:
    process.env.COOKIE_SAME_SITE || "lax",

  domain:
    process.env.COOKIE_DOMAIN || undefined,

  path:
    process.env.COOKIE_PATH || "/",
});

/* =========================================================
   ACCESS TOKEN COOKIE
========================================================= */

const setAccessTokenCookie = (res, token) => {
  const cookieName =
    process.env.ACCESS_TOKEN_COOKIE ||
    "paisa_access_token";

  const maxAge =
    Number(
      process.env.ACCESS_TOKEN_TTL ||
        15 * 60
    ) * 1000;

  res.cookie(
    cookieName,
    token,
    {
      ...getCookieOptions(),
      maxAge,
    }
  );
};

const clearAccessTokenCookie = (res) => {
  const cookieName =
    process.env.ACCESS_TOKEN_COOKIE ||
    "paisa_access_token";

  res.clearCookie(
    cookieName,
    getCookieOptions()
  );
};

/* =========================================================
   REFRESH TOKEN COOKIE
========================================================= */

const setRefreshTokenCookie = (res, token) => {
  const cookieName =
    process.env.REFRESH_TOKEN_COOKIE ||
    "paisa_refresh_token";

  const maxAge =
    Number(
      process.env.REFRESH_TOKEN_TTL ||
        30 * 24 * 60 * 60
    ) * 1000;

  res.cookie(
    cookieName,
    token,
    {
      ...getCookieOptions(),
      maxAge,
    }
  );
};

const clearRefreshTokenCookie = (res) => {
  const cookieName =
    process.env.REFRESH_TOKEN_COOKIE ||
    "paisa_refresh_token";

  res.clearCookie(
    cookieName,
    getCookieOptions()
  );
};

/* =========================================================
   REGISTER
========================================================= */

const register = async (req, res, next) => {
  try {
    if (!env.ALLOW_PUBLIC_REGISTRATION) {
      throw ApiError.forbidden(
        "Public registration is disabled. Ask your administrator for an account.",
        { code: "REGISTRATION_DISABLED" }
      );
    }

    // Role and tenant are never taken from the public request body;
    // authService.register applies the default role with no tenant.
    const {
      email,
      phone,
      password,
      name,
    } = req.body;

    const user =
      await authService.register({
        email,
        phone,
        password,
        name,
      });

    return sendCreated(res, {
      message:
        "Account created successfully",

      data: {
        user,
      },

      requestId:
        req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   LOGIN
========================================================= */

const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const result =
      await authService.login({
        email,
        password,

        ipAddress:
          getRequestIp(req),

        userAgent:
          getUserAgent(req),

        deviceId:
          getDeviceId(req),

        deviceName:
          getDeviceName(req),
      });

    setAccessTokenCookie(
      res,
      result.accessToken
    );

    setRefreshTokenCookie(
      res,
      result.refreshToken
    );

    return sendSuccess(res, {
      message:
        "Login successful",

      data: {
        user: result.user,

        // The SPA keeps the access token in
        // memory (Redux) — it never touches
        // localStorage. The refresh token
        // travels ONLY via the httpOnly cookie.
        accessToken: result.accessToken,

        expiresAt:
          result.expiresAt,

        sessionId:
          result.sessionId,
      },

      requestId:
        req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   REFRESH
========================================================= */

const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      getRefreshToken(req);

    if (!refreshToken) {
      throw ApiError.unauthorized(
        "Refresh token is required",
        "REFRESH_TOKEN_REQUIRED"
      );
    }

    const result =
      await authService.refreshSession({
        refreshToken,

        ipAddress:
          getRequestIp(req),

        userAgent:
          getUserAgent(req),
      });

    setAccessTokenCookie(
      res,
      result.accessToken
    );

    setRefreshTokenCookie(
      res,
      result.refreshToken
    );

    return sendSuccess(res, {
      message:
        "Session refreshed successfully",

      data: {
        user: result.user,

        // Same contract as login: body
        // carries the new access token.
        accessToken: result.accessToken,

        expiresAt:
          result.expiresAt,

        sessionId:
          result.sessionId,
      },

      requestId:
        req.requestId,
    });
  } catch (error) {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return next(error);
  }
};

/* =========================================================
   LOGOUT
========================================================= */

const logout = async (req, res, next) => {
  try {
    const userId =
      req.auth?.userId ||
      req.user?._id;

    const sessionId =
      req.auth?.sessionId ||
      req.auth?.sid ||
      req.user?.sessionId;

    if (!userId) {
      throw ApiError.unauthorized(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    await authService.logout({
      userId,
      sessionId,
    });

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return sendNoContent(res);
  } catch (error) {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return next(error);
  }
};

/* =========================================================
   LOGOUT ALL
========================================================= */

const logoutAll = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.auth?.userId ||
      req.user?._id;

    if (!userId) {
      throw ApiError.unauthorized(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    await authService.logoutAll({
      userId,
    });

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return sendSuccess(res, {
      message:
        "All sessions have been logged out",

      data: null,

      requestId:
        req.requestId,
    });
  } catch (error) {
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return next(error);
  }
};

/* =========================================================
   ME
========================================================= */

const me = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    const user =
      authService.sanitizeUser(
        req.user
      );

    return sendSuccess(res, {
      message:
        "Authenticated user retrieved successfully",

      data: {
        user,
      },

      requestId:
        req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   UPDATE OWN PROFILE / CHANGE PASSWORD
========================================================= */

const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized(
        "Authentication required",
        "AUTHENTICATION_REQUIRED"
      );
    }

    const {
      name,
      phone,
      currentPassword,
      newPassword,
    } = req.body ?? {};

    const user = await User.findById(
      req.user._id
    ).select("+passwordHash");

    if (!user) {
      throw ApiError.notFound(
        "User not found",
        "USER_NOT_FOUND"
      );
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();

      if (trimmed.length < 2 || trimmed.length > 100) {
        throw ApiError.badRequest(
          "Name must be 2-100 characters",
          { code: "INVALID_NAME" }
        );
      }

      user.name = trimmed;
    }

    if (phone !== undefined) {
      user.set(
        "profile.phone",
        phone ? String(phone).trim() : undefined
      );
    }

    let session = null;

    if (newPassword !== undefined) {
      const matches = await comparePassword(
        String(currentPassword ?? ""),
        user.passwordHash
      );

      if (!matches) {
        throw ApiError.badRequest(
          "Current password is incorrect",
          { code: "INVALID_CURRENT_PASSWORD" }
        );
      }

      user.passwordHash =
        await hashPassword(String(newPassword));

      // One second back so the session issued below (iat in whole
      // seconds) is not rejected as older than the password change.
      user.passwordChangedAt =
        new Date(Date.now() - 1000);

      user.mustChangePassword = false;
    }

    await user.save();

    if (newPassword !== undefined) {
      await RefreshSession.revokeUserSessions(
        user._id,
        "password_changed"
      );

      session = await authService.createSession({
        user,
        ipAddress: getRequestIp(req),
        userAgent: getUserAgent(req),
        deviceId: getDeviceId(req),
        deviceName: getDeviceName(req),
      });

      setAccessTokenCookie(
        res,
        session.accessToken
      );

      setRefreshTokenCookie(
        res,
        session.refreshToken
      );
    }

    return sendSuccess(res, {
      message: session
        ? "Password changed successfully"
        : "Profile updated successfully",

      data: {
        user: authService.sanitizeUser(user),

        ...(session && {
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          sessionId: session.sessionId,
        }),
      },

      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   FORGOT PASSWORD (public)
   Always the same 200 response: never reveals whether
   the email belongs to an account.
========================================================= */

const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body?.email;

    // Runs after the response so known and unknown emails take the
    // same time; failures are logged, never surfaced.
    sendInBackground("forgot-password", () =>
      requestPasswordReset(email).catch((error) => {
        logger.error("Forgot password failed", {
          error: error?.message,
          requestId: req.requestId,
        });
      })
    );

    return sendSuccess(res, {
      message: FORGOT_PASSWORD_MESSAGE,
      data: null,
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   RESET PASSWORD (public, single-use token)
========================================================= */

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    await resetPasswordWithToken({
      token,
      password,
    });

    // Any cookies on this browser belong to now-revoked sessions.
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    return sendSuccess(res, {
      message:
        "Your password has been reset. You can now sign in with the new password.",
      data: null,
      requestId: req.requestId,
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   EXPORTS
========================================================= */

export {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
};