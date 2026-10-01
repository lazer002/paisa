// server/src/controllers/authController.js

import authService from "../services/authService.js";
import ApiError from "../utils/ApiError.js";

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
    const {
      email,
      phone,
      password,
      name,
      role,
      instituteId,
      ...additionalData
    } = req.body;

    const user =
      await authService.register({
        email,
        phone,
        password,
        name,
        role,
        instituteId,
        ...additionalData,
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
   EXPORTS
========================================================= */

export {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
};