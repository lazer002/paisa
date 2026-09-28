// server/src/utils/sanitize.js

const SENSITIVE_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "passwordHash",
  "hash",
  "salt",
  "accessToken",
  "refreshToken",
  "token",
  "tokenHash",
  "authorization",
  "cookie",
  "otp",
  "otpCode",
  "verificationCode",
  "resetToken",
  "resetTokenHash",
  "apiKey",
  "apiSecret",
  "secret",
  "clientSecret",
  "privateKey",
  "encryptionKey",
  "encryptionSecret",
  "sessionToken",
  "csrfToken",
]);

const DEFAULT_REDACTED_VALUE =
  "[REDACTED]";

const DEFAULT_MAX_DEPTH = 10;

const DEFAULT_MAX_ARRAY_LENGTH = 100;

const DEFAULT_MAX_OBJECT_KEYS = 200;

const normalizeKey = (key) => {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, "");
};

const isSensitiveKey = (key) => {
  const normalized =
    normalizeKey(key);

  if (
    SENSITIVE_KEYS.has(normalized)
  ) {
    return true;
  }

  return [
    "password",
    "token",
    "secret",
    "apikey",
    "authorization",
    "privatekey",
    "otp",
  ].some((part) =>
    normalized.includes(part)
  );
};

const sanitizeValue = (
  value,
  options = {},
  depth = 0
) => {
  const {
    redactedValue =
      DEFAULT_REDACTED_VALUE,

    maxDepth =
      DEFAULT_MAX_DEPTH,

    maxArrayLength =
      DEFAULT_MAX_ARRAY_LENGTH,

    maxObjectKeys =
      DEFAULT_MAX_OBJECT_KEYS,
  } = options;

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    depth >= maxDepth
  ) {
    return "[MAX_DEPTH_REACHED]";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "bigint"
  ) {
    return value.toString();
  }

  if (
    typeof value === "function"
  ) {
    return "[FUNCTION]";
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    Buffer.isBuffer(value)
  ) {
    return "[BUFFER]";
  }

  if (
    value instanceof RegExp
  ) {
    return value.toString();
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .slice(0, maxArrayLength)
      .map((item) =>
        sanitizeValue(
          item,
          options,
          depth + 1
        )
      );
  }

  if (
    typeof value === "object"
  ) {
    const output = {};

    const entries =
      Object.entries(value).slice(
        0,
        maxObjectKeys
      );

    for (const [
      key,
      childValue,
    ] of entries) {
      if (
        isSensitiveKey(key)
      ) {
        output[key] =
          redactedValue;
        continue;
      }

      output[key] =
        sanitizeValue(
          childValue,
          options,
          depth + 1
        );
    }

    return output;
  }

  return String(value);
};

const sanitizeObject = (
  object,
  options = {}
) => {
  return sanitizeValue(
    object,
    options
  );
};

const sanitizeRequestBody = (
  body,
  options = {}
) => {
  return sanitizeValue(
    body,
    options
  );
};

const sanitizeHeaders = (
  headers,
  options = {}
) => {
  return sanitizeValue(
    headers,
    options
  );
};

const sanitizeQuery = (
  query,
  options = {}
) => {
  return sanitizeValue(
    query,
    options
  );
};

const sanitizeParams = (
  params,
  options = {}
) => {
  return sanitizeValue(
    params,
    options
  );
};

const sanitizeUser = (
  user,
  options = {}
) => {
  if (!user) {
    return null;
  }

  const sanitized =
    sanitizeValue(
      user,
      options
    );

  if (
    sanitized &&
    typeof sanitized === "object"
  ) {
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;
  }

  return sanitized;
};

const sanitizeError = (
  error,
  options = {}
) => {
  if (!error) {
    return null;
  }

  return {
    name:
      error.name || "Error",

    message:
      error.message ||
      "Unknown error",

    code:
      error.code || null,

    statusCode:
      error.statusCode ||
      null,

    stack:
      options.includeStack === true
        ? error.stack || null
        : undefined,

    details:
      error.details
        ? sanitizeValue(
            error.details,
            options
          )
        : undefined,

    errors:
      error.errors
        ? sanitizeValue(
            error.errors,
            options
          )
        : undefined,
  };
};

const pickSafeFields = (
  object,
  fields = []
) => {
  if (
    !object ||
    typeof object !== "object"
  ) {
    return {};
  }

  const output = {};

  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(
        object,
        field
      )
    ) {
      output[field] =
        isSensitiveKey(field)
          ? DEFAULT_REDACTED_VALUE
          : sanitizeValue(
              object[field]
            );
    }
  }

  return output;
};

const omitSensitiveFields = (
  object
) => {
  if (
    !object ||
    typeof object !== "object"
  ) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map(
      omitSensitiveFields
    );
  }

  const output = {};

  for (const [
    key,
    value,
  ] of Object.entries(object)) {
    if (
      isSensitiveKey(key)
    ) {
      continue;
    }

    if (
      value &&
      typeof value === "object"
    ) {
      output[key] =
        omitSensitiveFields(
          value
        );
    } else {
      output[key] = value;
    }
  }

  return output;
};

export {
  SENSITIVE_KEYS,
  DEFAULT_REDACTED_VALUE,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_ARRAY_LENGTH,
  DEFAULT_MAX_OBJECT_KEYS,
  normalizeKey,
  isSensitiveKey,
  sanitizeValue,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeHeaders,
  sanitizeQuery,
  sanitizeParams,
  sanitizeUser,
  sanitizeError,
  pickSafeFields,
  omitSensitiveFields,
};

export default sanitizeValue;
