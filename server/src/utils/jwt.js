// server/src/utils/jwt.js

import jwt from "jsonwebtoken";

import env from "../config/env.js";

/*
|--------------------------------------------------------------------------
| JWT Configuration
|--------------------------------------------------------------------------
*/

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN =
  env.JWT_ACCESS_EXPIRES_IN;

const REFRESH_EXPIRES_IN =
  env.JWT_REFRESH_EXPIRES_IN;

const ISSUER = env.JWT_ISSUER;
const AUDIENCE = env.JWT_AUDIENCE;

const ALGORITHM =
  env.JWT_ALGORITHM || "HS256";

const ACCESS_COOKIE =
  env.ACCESS_TOKEN_COOKIE ||
  "paisa_access_token";

const REFRESH_COOKIE =
  env.REFRESH_TOKEN_COOKIE ||
  "paisa_refresh_token";

/*
|--------------------------------------------------------------------------
| Secret Validation
|--------------------------------------------------------------------------
*/

const assertSecrets = () => {
  if (!ACCESS_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET is not configured"
    );
  }

  if (!REFRESH_SECRET) {
    throw new Error(
      "JWT_REFRESH_SECRET is not configured"
    );
  }
};

/*
|--------------------------------------------------------------------------
| Sign Access Token
|--------------------------------------------------------------------------
*/

const signAccessToken = (
  payload,
  options = {}
) => {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new TypeError(
      "JWT payload must be an object"
    );
  }

  assertSecrets();

  return jwt.sign(
    payload,
    ACCESS_SECRET,
    {
      expiresIn:
        options.expiresIn ||
        ACCESS_EXPIRES_IN,

      issuer:
        options.issuer ||
        ISSUER,

      audience:
        options.audience ||
        AUDIENCE,



     jwtid: options.jwtid
  ? String(options.jwtid)
  : crypto.randomUUID(),

      algorithm:
        options.algorithm ||
        ALGORITHM,
    }
  );
};

/*
|--------------------------------------------------------------------------
| Sign Refresh Token
|--------------------------------------------------------------------------
*/

const signRefreshToken = (
  payload,
  options = {}
) => {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    throw new TypeError(
      "JWT payload must be an object"
    );
  }

  assertSecrets();

  return jwt.sign(
    payload,
    REFRESH_SECRET,
    {
      expiresIn:
        options.expiresIn ||
        REFRESH_EXPIRES_IN,

      issuer:
        options.issuer ||
        ISSUER,

      audience:
        options.audience ||
        AUDIENCE,



     jwtid: options.jwtid
  ? String(options.jwtid)
  : crypto.randomUUID(),

      algorithm:
        options.algorithm ||
        ALGORITHM,
    }
  );
};

/*
|--------------------------------------------------------------------------
| Verify Access Token
|--------------------------------------------------------------------------
*/

const verifyAccessToken = (
  token,
  options = {}
) => {
  if (!token) {
    throw new Error(
      "Access token is required"
    );
  }

  assertSecrets();

  return jwt.verify(
    token,
    ACCESS_SECRET,
    {
      issuer:
        options.issuer ||
        ISSUER,

      audience:
        options.audience ||
        AUDIENCE,

      algorithms: [
        options.algorithm ||
          ALGORITHM,
      ],

      clockTolerance:
        options.clockTolerance || 0,
    }
  );
};

/*
|--------------------------------------------------------------------------
| Verify Refresh Token
|--------------------------------------------------------------------------
*/

const verifyRefreshToken = (
  token,
  options = {}
) => {
  if (!token) {
    throw new Error(
      "Refresh token is required"
    );
  }

  assertSecrets();

  return jwt.verify(
    token,
    REFRESH_SECRET,
    {
      issuer:
        options.issuer ||
        ISSUER,

      audience:
        options.audience ||
        AUDIENCE,

      algorithms: [
        options.algorithm ||
          ALGORITHM,
      ],

      clockTolerance:
        options.clockTolerance || 0,
    }
  );
};

/*
|--------------------------------------------------------------------------
| Decode Token
|--------------------------------------------------------------------------
*/

const decodeToken = (
  token,
  options = {}
) => {
  if (!token) {
    return null;
  }

  return jwt.decode(token, {
    complete:
      options.complete !== false,
  });
};

/*
|--------------------------------------------------------------------------
| Token Expiration
|--------------------------------------------------------------------------
*/

const getTokenExpiration = (
  token
) => {
  if (!token) {
    return null;
  }

  const decoded = jwt.decode(token);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    !decoded.exp
  ) {
    return null;
  }

  return new Date(
    decoded.exp * 1000
  );
};

const isTokenExpired = (
  token
) => {
  const expiration =
    getTokenExpiration(token);

  if (!expiration) {
    return true;
  }

  return (
    expiration.getTime() <=
    Date.now()
  );
};

const getTokenRemainingMs = (
  token
) => {
  const expiration =
    getTokenExpiration(token);

  if (!expiration) {
    return 0;
  }

  return Math.max(
    0,
    expiration.getTime() -
      Date.now()
  );
};

/*
|--------------------------------------------------------------------------
| Authorization Header
|--------------------------------------------------------------------------
*/

const extractBearerToken = (
  authorizationHeader
) => {
  if (
    !authorizationHeader ||
    typeof authorizationHeader !==
      "string"
  ) {
    return null;
  }

  const parts =
    authorizationHeader
      .trim()
      .split(/\s+/);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (
    scheme.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
};

/*
|--------------------------------------------------------------------------
| Access Token Extraction
|--------------------------------------------------------------------------
|
| Supports:
| 1. Authorization: Bearer <token>
| 2. Access-token cookie
|
|--------------------------------------------------------------------------
*/

const extractAccessToken = (
  req
) => {
  if (!req) {
    return null;
  }

  const headerToken =
    extractBearerToken(
      req.headers?.authorization
    );

  if (headerToken) {
    return {
      token: headerToken,
      source: "header",
    };
  }

  const cookieToken =
    req.cookies?.[ACCESS_COOKIE];

  if (cookieToken) {
    return {
      token: cookieToken,
      source: "cookie",
    };
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Generic Token Extraction
|--------------------------------------------------------------------------
*/

const extractTokenFromRequest = (
  req
) => {
  return extractAccessToken(req);
};

/*
|--------------------------------------------------------------------------
| Refresh Token Extraction
|--------------------------------------------------------------------------
*/

const extractRefreshTokenFromRequest = (
  req
) => {
  if (!req) {
    return null;
  }

  const headerToken =
    extractBearerToken(
      req.headers?.authorization
    );

  if (headerToken) {
    return {
      token: headerToken,
      source: "header",
    };
  }

  const cookieToken =
    req.cookies?.[REFRESH_COOKIE];

  if (cookieToken) {
    return {
      token: cookieToken,
      source: "cookie",
    };
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Sanitize JWT Payload
|--------------------------------------------------------------------------
*/

const sanitizeJwtPayload = (
  payload
) => {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return {};
  }

  const {
    iat,
    exp,
    nbf,
    jti,
    iss,
    aud,
    ...safePayload
  } = payload;

  return safePayload;
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  signAccessToken,
  signRefreshToken,

  verifyAccessToken,
  verifyRefreshToken,

  decodeToken,

  getTokenExpiration,
  isTokenExpired,
  getTokenRemainingMs,

  extractBearerToken,
  extractAccessToken,
  extractTokenFromRequest,
  extractRefreshTokenFromRequest,

  sanitizeJwtPayload,
};

export default {
  signAccessToken,
  signRefreshToken,

  verifyAccessToken,
  verifyRefreshToken,

  decodeToken,

  getTokenExpiration,
  isTokenExpired,
  getTokenRemainingMs,

  extractBearerToken,
  extractAccessToken,
  extractTokenFromRequest,
  extractRefreshTokenFromRequest,

  sanitizeJwtPayload,
};