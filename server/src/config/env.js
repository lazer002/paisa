// server/src/config/env.js

import dotenv from "dotenv";

dotenv.config();

const getEnv = (
  key,
  defaultValue = undefined
) => {
  const value = process.env[key];

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  return value.trim();
};

const getRequiredEnv = (key) => {
  const value = getEnv(key);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
};

const getBooleanEnv = (
  key,
  defaultValue = false
) => {
  const value = getEnv(key);

  if (value === undefined) {
    return defaultValue;
  }

  return [
    "true",
    "1",
    "yes",
    "on",
  ].includes(value.toLowerCase());
};

const getNumberEnv = (
  key,
  defaultValue
) => {
  const value = getEnv(key);

  if (value === undefined) {
    return defaultValue;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : defaultValue;
};

const NODE_ENV =
  getEnv(
    "NODE_ENV",
    "development"
  );

const env = Object.freeze({
  NODE_ENV,

  IS_DEVELOPMENT:
    NODE_ENV === "development",

  IS_TEST:
    NODE_ENV === "test",

  IS_PRODUCTION:
    NODE_ENV === "production",

  APP_NAME:
    getEnv("APP_NAME", "PAISA API"),

  APP_VERSION:
    getEnv("APP_VERSION", "1.0.0"),

  HOST:
    getEnv("HOST", "0.0.0.0"),

  PORT:
    getNumberEnv("PORT", 5000),

  API_PREFIX:
    getEnv(
      "API_PREFIX",
      "/api"
    ),

  TRUST_PROXY:
    getEnv(
      "TRUST_PROXY",
      NODE_ENV === "production"
        ? "1"
        : "false"
    ),

  MONGO_URI:
    getEnv("MONGO_URI"),

  MONGODB_URI:
    getEnv("MONGODB_URI"),

  MONGO_DB_NAME:
    getEnv("MONGO_DB_NAME"),

  MONGO_MAX_POOL_SIZE:
    getNumberEnv(
      "MONGO_MAX_POOL_SIZE",
      20
    ),

  MONGO_MIN_POOL_SIZE:
    getNumberEnv(
      "MONGO_MIN_POOL_SIZE",
      5
    ),

  MONGO_SERVER_SELECTION_TIMEOUT:
    getNumberEnv(
      "MONGO_SERVER_SELECTION_TIMEOUT",
      5000
    ),

  MONGO_SOCKET_TIMEOUT:
    getNumberEnv(
      "MONGO_SOCKET_TIMEOUT",
      45000
    ),

  MONGO_CONNECT_TIMEOUT:
    getNumberEnv(
      "MONGO_CONNECT_TIMEOUT",
      10000
    ),

  MONGO_HEARTBEAT_FREQUENCY:
    getNumberEnv(
      "MONGO_HEARTBEAT_FREQUENCY",
      10000
    ),

  REDIS_URL:
    getEnv(
      "REDIS_URL",
      "redis://127.0.0.1:6379"
    ),

  REDIS_HOST:
    getEnv(
      "REDIS_HOST",
      "127.0.0.1"
    ),

  REDIS_PORT:
    getNumberEnv(
      "REDIS_PORT",
      6379
    ),

  REDIS_USERNAME:
    getEnv("REDIS_USERNAME"),

  REDIS_PASSWORD:
    getEnv("REDIS_PASSWORD"),

  REDIS_DB:
    getNumberEnv(
      "REDIS_DB",
      0
    ),

  REDIS_REQUIRED:
    getBooleanEnv(
      "REDIS_REQUIRED",
      false
    ),

  REDIS_CONNECT_TIMEOUT:
    getNumberEnv(
      "REDIS_CONNECT_TIMEOUT",
      10000
    ),

  REDIS_RECONNECT_MAX_RETRIES:
    getNumberEnv(
      "REDIS_RECONNECT_MAX_RETRIES",
      10
    ),

  JWT_ACCESS_SECRET:
    getEnv("JWT_ACCESS_SECRET"),

  JWT_REFRESH_SECRET:
    getEnv("JWT_REFRESH_SECRET"),

  JWT_ACCESS_EXPIRES_IN:
    getEnv(
      "JWT_ACCESS_EXPIRES_IN",
      "15m"
    ),

  JWT_REFRESH_EXPIRES_IN:
    getEnv(
      "JWT_REFRESH_EXPIRES_IN",
      "30d"
    ),

  JWT_ISSUER:
    getEnv(
      "JWT_ISSUER",
      "paisa-api"
    ),

  JWT_AUDIENCE:
    getEnv(
      "JWT_AUDIENCE",
      "paisa-client"
    ),

  JWT_ALGORITHM:
    getEnv(
      "JWT_ALGORITHM",
      "HS256"
    ),

  COOKIE_SECURE:
    getBooleanEnv(
      "COOKIE_SECURE",
      NODE_ENV === "production"
    ),

  COOKIE_HTTP_ONLY:
    getBooleanEnv(
      "COOKIE_HTTP_ONLY",
      true
    ),

  COOKIE_SAME_SITE:
    getEnv(
      "COOKIE_SAME_SITE",
      "lax"
    ),

  COOKIE_DOMAIN:
    getEnv("COOKIE_DOMAIN"),

  COOKIE_PATH:
    getEnv(
      "COOKIE_PATH",
      "/"
    ),

  ACCESS_TOKEN_COOKIE:
    getEnv(
      "ACCESS_TOKEN_COOKIE",
      "paisa_access_token"
    ),

  REFRESH_TOKEN_COOKIE:
    getEnv(
      "REFRESH_TOKEN_COOKIE",
      "paisa_refresh_token"
    ),

  CORS_ORIGIN:
    getEnv("CORS_ORIGIN"),

  CORS_ORIGINS:
    getEnv("CORS_ORIGINS"),

  FRONTEND_URL:
    getEnv(
      "FRONTEND_URL",
      "http://localhost:5173"
    ),

  JSON_BODY_LIMIT:
    getEnv(
      "JSON_BODY_LIMIT",
      "1mb"
    ),

  URLENCODED_BODY_LIMIT:
    getEnv(
      "URLENCODED_BODY_LIMIT",
      "1mb"
    ),

  REQUEST_TIMEOUT:
    getNumberEnv(
      "REQUEST_TIMEOUT",
      120000
    ),

  KEEP_ALIVE_TIMEOUT:
    getNumberEnv(
      "KEEP_ALIVE_TIMEOUT",
      65000
    ),

  HEADERS_TIMEOUT:
    getNumberEnv(
      "HEADERS_TIMEOUT",
      66000
    ),

  MAX_REQUESTS_PER_SOCKET:
    getNumberEnv(
      "MAX_REQUESTS_PER_SOCKET",
      0
    ),

  RATE_LIMIT_WINDOW_MS:
    getNumberEnv(
      "RATE_LIMIT_WINDOW_MS",
      60000
    ),

  RATE_LIMIT_MAX:
    getNumberEnv(
      "RATE_LIMIT_MAX",
      100
    ),

  AUTH_RATE_LIMIT_WINDOW_MS:
    getNumberEnv(
      "AUTH_RATE_LIMIT_WINDOW_MS",
      900000
    ),

  AUTH_RATE_LIMIT_MAX:
    getNumberEnv(
      "AUTH_RATE_LIMIT_MAX",
      20
    ),

  LOGIN_RATE_LIMIT_MAX:
    getNumberEnv(
      "LOGIN_RATE_LIMIT_MAX",
      10
    ),

  OTP_RATE_LIMIT_MAX:
    getNumberEnv(
      "OTP_RATE_LIMIT_MAX",
      5
    ),

  PASSWORD_RESET_RATE_LIMIT_MAX:
    getNumberEnv(
      "PASSWORD_RESET_RATE_LIMIT_MAX",
      5
    ),

  SESSION_TTL_SECONDS:
    getNumberEnv(
      "SESSION_TTL_SECONDS",
      2592000
    ),

  OTP_TTL_SECONDS:
    getNumberEnv(
      "OTP_TTL_SECONDS",
      300
    ),

  PASSWORD_RESET_TTL_SECONDS:
    getNumberEnv(
      "PASSWORD_RESET_TTL_SECONDS",
      900
    ),

  EMAIL_VERIFICATION_TTL_SECONDS:
    getNumberEnv(
      "EMAIL_VERIFICATION_TTL_SECONDS",
      86400
    ),

  IDEMPOTENCY_TTL_SECONDS:
    getNumberEnv(
      "IDEMPOTENCY_TTL_SECONDS",
      86400
    ),

  LOG_LEVEL:
    getEnv(
      "LOG_LEVEL",
      NODE_ENV === "production"
        ? "info"
        : "debug"
    ),

  LOG_FORMAT:
    getEnv(
      "LOG_FORMAT",
      "json"
    ),

  LOG_SERVICE:
    getEnv(
      "LOG_SERVICE",
      "paisa-api"
    ),

  LOG_REQUEST_BODY:
    getBooleanEnv(
      "LOG_REQUEST_BODY",
      false
    ),

  LOG_REQUEST_HEADERS:
    getBooleanEnv(
      "LOG_REQUEST_HEADERS",
      false
    ),

  FRONTEND_APP_URL:
    getEnv(
      "FRONTEND_APP_URL",
      "http://localhost:5173"
    ),

  EMAIL_ENABLED:
    getBooleanEnv(
      "EMAIL_ENABLED",
      false
    ),

  EMAIL_HOST:
    getEnv("EMAIL_HOST"),

  EMAIL_PORT:
    getNumberEnv(
      "EMAIL_PORT",
      587
    ),

  EMAIL_USER:
    getEnv("EMAIL_USER"),

  EMAIL_PASSWORD:
    getEnv("EMAIL_PASSWORD"),

  EMAIL_FROM:
    getEnv("EMAIL_FROM"),

  SMS_ENABLED:
    getBooleanEnv(
      "SMS_ENABLED",
      false
    ),

  SMS_PROVIDER:
    getEnv("SMS_PROVIDER"),

  SMS_API_KEY:
    getEnv("SMS_API_KEY"),

  SMS_API_SECRET:
    getEnv("SMS_API_SECRET"),

  PUSH_ENABLED:
    getBooleanEnv(
      "PUSH_ENABLED",
      false
    ),

  STORAGE_PROVIDER:
    getEnv(
      "STORAGE_PROVIDER",
      "local"
    ),

  STORAGE_PATH:
    getEnv(
      "STORAGE_PATH",
      "./uploads"
    ),

  MAX_FILE_SIZE_MB:
    getNumberEnv(
      "MAX_FILE_SIZE_MB",
      10
    ),

  DEFAULT_PAGE:
    getNumberEnv(
      "DEFAULT_PAGE",
      1
    ),

  DEFAULT_LIMIT:
    getNumberEnv(
      "DEFAULT_LIMIT",
      20
    ),

  MAX_LIMIT:
    getNumberEnv(
      "MAX_LIMIT",
      100
    ),

  AUDIT_ENABLED:
    getBooleanEnv(
      "AUDIT_ENABLED",
      true
    ),

  AUDIT_RETENTION_DAYS:
    getNumberEnv(
      "AUDIT_RETENTION_DAYS",
      365
    ),

  DEFAULT_TIMEZONE:
    getEnv(
      "DEFAULT_TIMEZONE",
      "Asia/Kolkata"
    ),

  DEFAULT_LOCALE:
    getEnv(
      "DEFAULT_LOCALE",
      "en-IN"
    ),

  DEFAULT_CURRENCY:
    getEnv(
      "DEFAULT_CURRENCY",
      "INR"
    ),
});

export {
  getEnv,
  getRequiredEnv,
  getBooleanEnv,
  getNumberEnv,
};

export default env;
