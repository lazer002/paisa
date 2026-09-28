// server/src/utils/redis.js

import {
  getRedisClient,
  isRedisReady,
  redisGet,
  redisSet,
  redisDelete,
  redisExists,
  redisExpire,
  redisTTL,
} from "../config/redis.js";

const DEFAULT_TTL = 300;

const buildKey = (...parts) => {
  return parts
    .filter(
      (part) =>
        part !== undefined &&
        part !== null &&
        String(part).length > 0
    )
    .map((part) =>
      String(part)
        .trim()
        .replace(/\s+/g, ":")
    )
    .join(":");
};

const parseValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const get = async (key) => {
  const value = await redisGet(key);

  return parseValue(value);
};

const set = async (
  key,
  value,
  ttl = DEFAULT_TTL
) => {
  return redisSet(key, value, {
    ttl,
  });
};

const setIfNotExists = async (
  key,
  value,
  ttl = DEFAULT_TTL
) => {
  return redisSet(key, value, {
    ttl,
    NX: true,
  });
};

const setIfExists = async (
  key,
  value,
  ttl = DEFAULT_TTL
) => {
  return redisSet(key, value, {
    ttl,
    XX: true,
  });
};

const del = async (...keys) => {
  return redisDelete(...keys);
};

const exists = async (...keys) => {
  return redisExists(...keys);
};

const expire = async (
  key,
  seconds
) => {
  return redisExpire(key, seconds);
};

const ttl = async (key) => {
  return redisTTL(key);
};

const remember = async (
  key,
  callback,
  ttlSeconds = DEFAULT_TTL
) => {
  const cached = await get(key);

  if (cached !== null) {
    return cached;
  }

  const value = await callback();

  if (
    value !== undefined &&
    value !== null
  ) {
    await set(
      key,
      value,
      ttlSeconds
    );
  }

  return value;
};

const forget = async (...keys) => {
  return del(...keys);
};

const clearByPattern = async (
  pattern
) => {
  if (!isRedisReady()) {
    return 0;
  }

  const client = getRedisClient();

  let cursor = 0;
  let deleted = 0;

  do {
    const result =
      await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

    cursor = result.cursor;

    if (result.keys.length > 0) {
      deleted += await client.del(
        result.keys
      );
    }
  } while (cursor !== 0);

  return deleted;
};

const increment = async (
  key,
  amount = 1
) => {
  if (!isRedisReady()) {
    return null;
  }

  return getRedisClient().incrBy(
    key,
    Number(amount)
  );
};

const decrement = async (
  key,
  amount = 1
) => {
  if (!isRedisReady()) {
    return null;
  }

  return getRedisClient().decrBy(
    key,
    Number(amount)
  );
};

const setJSON = async (
  key,
  value,
  ttlSeconds = DEFAULT_TTL
) => {
  return set(
    key,
    value,
    ttlSeconds
  );
};

const getJSON = async (key) => {
  return get(key);
};

const cacheKey = {
  user: (userId) =>
    buildKey(
      "paisa",
      "user",
      userId
    ),

  userPermissions: (userId) =>
    buildKey(
      "paisa",
      "user",
      userId,
      "permissions"
    ),

  userSession: (sessionId) =>
    buildKey(
      "paisa",
      "session",
      sessionId
    ),

  refreshSession: (sessionId) =>
    buildKey(
      "paisa",
      "refresh",
      sessionId
    ),

  organization: (organizationId) =>
    buildKey(
      "paisa",
      "organization",
      organizationId
    ),

  organizationSettings: (
    organizationId
  ) =>
    buildKey(
      "paisa",
      "organization",
      organizationId,
      "settings"
    ),

  rateLimit: (
    identifier,
    action
  ) =>
    buildKey(
      "paisa",
      "rate-limit",
      action,
      identifier
    ),

  otp: (
    purpose,
    identifier
  ) =>
    buildKey(
      "paisa",
      "otp",
      purpose,
      identifier
    ),

  passwordReset: (
    tokenHash
  ) =>
    buildKey(
      "paisa",
      "password-reset",
      tokenHash
    ),

  emailVerification: (
    tokenHash
  ) =>
    buildKey(
      "paisa",
      "email-verification",
      tokenHash
    ),

  idempotency: (
    scope,
    key
  ) =>
    buildKey(
      "paisa",
      "idempotency",
      scope,
      key
    ),

  lock: (
    resource,
    resourceId
  ) =>
    buildKey(
      "paisa",
      "lock",
      resource,
      resourceId
    ),

  notification: (
    notificationId
  ) =>
    buildKey(
      "paisa",
      "notification",
      notificationId
    ),

  custom: (...parts) =>
    buildKey(
      "paisa",
      ...parts
    ),
};

export {
  DEFAULT_TTL,
  buildKey,
  parseValue,
  get,
  set,
  setIfNotExists,
  setIfExists,
  del,
  exists,
  expire,
  ttl,
  remember,
  forget,
  clearByPattern,
  increment,
  decrement,
  setJSON,
  getJSON,
  cacheKey,
};

export default {
  DEFAULT_TTL,
  buildKey,
  parseValue,
  get,
  set,
  setIfNotExists,
  setIfExists,
  del,
  exists,
  expire,
  ttl,
  remember,
  forget,
  clearByPattern,
  increment,
  decrement,
  setJSON,
  getJSON,
  cacheKey,
};
