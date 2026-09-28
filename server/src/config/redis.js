// server/src/config/redis.js

import { createClient } from "redis";

import env from "./env.js";
import logger from "./logger.js";

let redisClient = null;
let redisReady = false;
let redisConnecting = false;

const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl =
    process.env.REDIS_URL ||
    "redis://127.0.0.1:6379";

  redisClient = createClient({
    url: redisUrl,

    socket: {
      reconnectStrategy(retries) {
        const maxDelay = 3000;

        const delay = Math.min(
          retries * 250,
          maxDelay
        );

        logger.warn(
          "Redis reconnect scheduled",
          {
            retries,
            delay,
          }
        );

        return delay;
      },

      connectTimeout: 10000,

      keepAlive: 5000,

      noDelay: true,
    },

    database: Number(
      process.env.REDIS_DB || 0
    ),

    username:
      process.env.REDIS_USERNAME ||
      undefined,

    password:
      process.env.REDIS_PASSWORD ||
      undefined,
  });

  redisClient.on("connect", () => {
    redisConnecting = true;

    logger.info("Redis connecting");
  });

  redisClient.on("ready", () => {
    redisReady = true;
    redisConnecting = false;

    logger.info("Redis ready");
  });

  redisClient.on("reconnecting", () => {
    redisReady = false;
    redisConnecting = true;

    logger.warn("Redis reconnecting");
  });

  redisClient.on("error", (error) => {
    redisReady = false;

    logger.error("Redis error", {
      error,
    });
  });

  redisClient.on("end", () => {
    redisReady = false;
    redisConnecting = false;

    logger.warn("Redis connection closed");
  });

  return redisClient;
};

const connectRedis = async () => {
  const client =
    createRedisClient();

  if (client.isReady) {
    redisReady = true;

    return client;
  }

  if (redisConnecting) {
    return client;
  }

  try {
    redisConnecting = true;

    await client.connect();

    redisReady = true;
    redisConnecting = false;

    return client;
  } catch (error) {
    redisReady = false;
    redisConnecting = false;

    logger.error(
      "Redis connection failed",
      {
        error,
      }
    );

    throw error;
  }
};

const disconnectRedis = async () => {
  if (!redisClient) {
    return;
  }

  try {
    if (
      redisClient.isOpen
    ) {
      await redisClient.quit();
    }

    redisReady = false;
    redisConnecting = false;

    logger.info(
      "Redis disconnected successfully"
    );
  } catch (error) {
    logger.error(
      "Redis disconnect failed",
      {
        error,
      }
    );

    try {
      if (redisClient.isOpen) {
        await redisClient.disconnect();
      }
    } catch {
      // Ignore forced disconnect errors.
    }

    redisReady = false;
    redisConnecting = false;

    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient();
  }

  return redisClient;
};

const isRedisReady = () => {
  return Boolean(
    redisReady &&
      redisClient?.isReady
  );
};

const getRedisStatus = () => {
  return {
    connected: Boolean(
      redisClient?.isOpen
    ),

    ready: Boolean(
      redisClient?.isReady
    ),

    connecting: redisConnecting,

    status: redisClient?.isReady
      ? "ready"
      : redisClient?.isOpen
        ? "connected"
        : "disconnected",
  };
};

const pingRedis = async () => {
  if (!redisClient?.isReady) {
    return false;
  }

  try {
    const response =
      await redisClient.ping();

    return response === "PONG";
  } catch (error) {
    logger.error(
      "Redis ping failed",
      {
        error,
      }
    );

    return false;
  }
};

const redisGet = async (key) => {
  if (!isRedisReady()) {
    return null;
  }

  return redisClient.get(key);
};

const redisSet = async (
  key,
  value,
  options = {}
) => {
  if (!isRedisReady()) {
    return false;
  }

  const serialized =
    typeof value === "string"
      ? value
      : JSON.stringify(value);

  const setOptions = {};

  if (
    options.ttl !== undefined &&
    options.ttl !== null
  ) {
    setOptions.EX = Number(
      options.ttl
    );
  }

  if (options.NX === true) {
    setOptions.NX = true;
  }

  if (options.XX === true) {
    setOptions.XX = true;
  }

  const result =
    await redisClient.set(
      key,
      serialized,
      setOptions
    );

  return result;
};

const redisDelete = async (...keys) => {
  if (
    !isRedisReady() ||
    keys.length === 0
  ) {
    return 0;
  }

  return redisClient.del(keys);
};

const redisExists = async (...keys) => {
  if (
    !isRedisReady() ||
    keys.length === 0
  ) {
    return 0;
  }

  return redisClient.exists(keys);
};

const redisExpire = async (
  key,
  seconds
) => {
  if (!isRedisReady()) {
    return false;
  }

  return redisClient.expire(
    key,
    Number(seconds)
  );
};

const redisTTL = async (key) => {
  if (!isRedisReady()) {
    return -2;
  }

  return redisClient.ttl(key);
};

export {
  createRedisClient,
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisReady,
  getRedisStatus,
  pingRedis,
  redisGet,
  redisSet,
  redisDelete,
  redisExists,
  redisExpire,
  redisTTL,
};

export default getRedisClient;
