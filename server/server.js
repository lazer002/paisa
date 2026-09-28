// server/server.js

import "dotenv/config";

import http from "http";

import app from "./src/app.js";
import env from "./src/config/env.js";
import {
  connectDB,
  disconnectDB,
} from "./src/config/db.js";
import {
  connectRedis,
  disconnectRedis,
} from "./src/config/redis.js";
import logger from "./src/config/logger.js";

let server = null;
let shuttingDown = false;

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const start = async () => {
  try {
    /*
     * MongoDB
     */
    await connectDB();

    /*
     * Redis
     *
     * Redis is optional unless REDIS_REQUIRED=true.
     */
if (env.REDIS_REQUIRED) {
  await connectRedis();

  logger.info("Redis connection established");
} else {
  logger.info(
    "Redis is optional and not required. Skipping Redis connection."
  );
}

    /*
     * HTTP Server
     */
    server = http.createServer(app);

    /*
     * Server timeouts
     */
    if (env.KEEP_ALIVE_TIMEOUT) {
      server.keepAliveTimeout =
        env.KEEP_ALIVE_TIMEOUT;
    }

    if (env.HEADERS_TIMEOUT) {
      server.headersTimeout =
        env.HEADERS_TIMEOUT;
    }

    /*
     * Maximum requests per socket
     */
    if (env.MAX_REQUESTS_PER_SOCKET > 0) {
      server.maxRequestsPerSocket =
        env.MAX_REQUESTS_PER_SOCKET;
    }

    /*
     * Start listening
     */
    await new Promise((resolve, reject) => {
      server.once("error", reject);

      server.listen(
        env.PORT,
        env.HOST,
        () => {
          server.removeListener(
            "error",
            reject
          );

          resolve();
        }
      );
    });

    logger.info("PAISA API started", {
      host: env.HOST,
      port: env.PORT,
      environment: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    });

    console.log(
      `🚀 PAISA API running on ${env.HOST}:${env.PORT}`
    );

    console.log(
      `🌍 Environment: ${env.NODE_ENV}`
    );

    console.log(
      `❤️ Health: http://localhost:${env.PORT}/health`
    );

    /*
     * Request timeout
     */
    if (env.REQUEST_TIMEOUT > 0) {
      server.setTimeout(
        env.REQUEST_TIMEOUT
      );
    }

    return server;
  } catch (error) {
    logger.fatal("Failed to start PAISA", {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    });

    console.error(
      "❌ Failed to start PAISA:",
      error?.message
    );

    await disconnectRedis().catch(() => {});
    await disconnectDB().catch(() => {});

    process.exitCode = 1;

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const shutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info(
    `${signal} received. Starting graceful shutdown.`
  );

  /*
   * Stop accepting new connections
   */
  if (server) {
    await new Promise((resolve) => {
      server.close(() => {
        resolve();
      });

      /*
       * Force shutdown after 10 seconds.
       */
      setTimeout(() => {
        resolve();
      }, 10000).unref();
    });
  }

  /*
   * Redis
   */
  try {
    await disconnectRedis();
  } catch (error) {
    logger.error(
      "Redis shutdown failed",
      {
        error,
      }
    );
  }

  /*
   * MongoDB
   */
  try {
    await disconnectDB();
  } catch (error) {
    logger.error(
      "MongoDB shutdown failed",
      {
        error,
      }
    );
  }

  logger.info(
    "PAISA graceful shutdown complete."
  );

  process.exitCode = 0;
};

/*
|--------------------------------------------------------------------------
| Process Signals
|--------------------------------------------------------------------------
*/

process.once(
  "SIGINT",
  () => {
    void shutdown("SIGINT");
  }
);

process.once(
  "SIGTERM",
  () => {
    void shutdown("SIGTERM");
  }
);

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

await start();

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export { server };
export default app;