import mongoose from "mongoose";

import crypto from "node:crypto";
import env from "./env.js";
import logger from "./logger.js";

let isConnected = false;
let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  mongoose.connection.on("connected", () => {
    isConnected = true;

    logger.info("MongoDB connected", {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  });

  mongoose.connection.on("error", (error) => {
    isConnected = false;

    logger.error("MongoDB connection error", {
      error,
    });
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;

    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    isConnected = true;

    logger.info("MongoDB reconnected");
  });

  mongoose.connection.on("connecting", () => {
    logger.info("Connecting to MongoDB");
  });

  mongoose.connection.on("disconnecting", () => {
    logger.info("Disconnecting from MongoDB");
  });
};

const connectDB = async () => {
  if (
    isConnected &&
    mongoose.connection.readyState === 1
  ) {
    return mongoose.connection;
  }

  registerConnectionListeners();

  try {
    mongoose.set("strictQuery", true);

    const mongoUri =
      env.MONGO_URI ||
      env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI or MONGODB_URI is not configured"
      );
    }

    const connection =
      await mongoose.connect(
        mongoUri,
        {
          maxPoolSize:
            env.MONGO_MAX_POOL_SIZE,

          minPoolSize:
            env.MONGO_MIN_POOL_SIZE,

          serverSelectionTimeoutMS:
            env.MONGO_SERVER_SELECTION_TIMEOUT,

          socketTimeoutMS:
            env.MONGO_SOCKET_TIMEOUT,

          connectTimeoutMS:
            env.MONGO_CONNECT_TIMEOUT,

          heartbeatFrequencyMS:
            env.MONGO_HEARTBEAT_FREQUENCY,

          retryWrites: true,

          retryReads: true,

          autoIndex:
            !env.IS_PRODUCTION,

          autoCreate:
            !env.IS_PRODUCTION,
        }
      );

    isConnected = true;

    logger.info(
      "MongoDB connection established",
      {
        host:
          connection.connection.host,

        database:
          connection.connection.name,

        readyState:
          connection.connection.readyState,
      }
    );

    return connection.connection;
  } catch (error) {
    isConnected = false;

    logger.fatal(
      "MongoDB connection failed",
      {
        error: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
        },
      }
    );

    throw error;
  }
};

const disconnectDB = async () => {
  if (
    mongoose.connection.readyState === 0
  ) {
    isConnected = false;
    return;
  }

  try {
    await mongoose.disconnect();

    isConnected = false;

    logger.info(
      "MongoDB disconnected successfully"
    );
  } catch (error) {
    logger.error(
      "MongoDB disconnect failed",
      {
        error,
      }
    );

    throw error;
  }
};

const getDBStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    connected:
      mongoose.connection.readyState === 1,

    state:
      states[
        mongoose.connection.readyState
      ] || "unknown",

    readyState:
      mongoose.connection.readyState,

    host:
      mongoose.connection.host || null,

    database:
      mongoose.connection.name || null,
  };
};

const pingDB = async () => {
  if (
    mongoose.connection.readyState !== 1
  ) {
    return false;
  }

  try {
    await mongoose.connection.db.command({
      ping: 1,
    });

    return true;
  } catch (error) {
    logger.error(
      "MongoDB ping failed",
      {
        error,
      }
    );

    return false;
  }
};

const gracefulShutdown = async (
  signal
) => {
  logger.info(
    `Received ${signal}. Closing MongoDB connection...`
  );

  try {
    await disconnectDB();

    logger.info(
      "MongoDB shutdown complete"
    );
  } catch (error) {
    logger.error(
      "MongoDB shutdown failed",
      {
        error,
      }
    );

    process.exitCode = 1;
  }
};

process.once(
  "SIGINT",
  () => {
    void gracefulShutdown("SIGINT");
  }
);

process.once(
  "SIGTERM",
  () => {
    void gracefulShutdown("SIGTERM");
  }
);

export {
  connectDB,
  disconnectDB,
  getDBStatus,
  pingDB,
};

export default connectDB;
