import env from "./env.js";

const LEVELS = Object.freeze({
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
});

const normalizeLevel = (level) => {
  const value = String(level || "info")
    .trim()
    .toLowerCase();

  return Object.prototype.hasOwnProperty.call(
    LEVELS,
    value
  )
    ? value
    : "info";
};

const CURRENT_LEVEL =
  LEVELS[normalizeLevel(env.LOG_LEVEL)];

const shouldLog = (level) => {
  const normalized =
    normalizeLevel(level);

  return (
    LEVELS[normalized] <=
    CURRENT_LEVEL
  );
};

const serializeError = (error) => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode:
        error.statusCode,
    };
  }

  return error;
};

const serialize = (
  level,
  message,
  meta = {}
) => {
  const entry = {
    timestamp:
      new Date().toISOString(),

    level,

    service:
      env.LOG_SERVICE ||
      env.APP_NAME ||
      "paisa-api",

    environment:
      env.NODE_ENV ||
      "development",

    message:
      typeof message === "string"
        ? message
        : String(message),
  };

  if (
    meta &&
    typeof meta === "object"
  ) {
    Object.assign(entry, meta);
  }

  return entry;
};

const write = (
  level,
  message,
  meta
) => {
  if (!shouldLog(level)) {
    return;
  }

  const entry = serialize(
    level,
    message,
    meta
  );

  const output =
    env.LOG_FORMAT === "json"
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] [${level.toUpperCase()}] ${entry.message}`;

  if (level === "fatal" || level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
};

const debug = (
  message,
  meta = {}
) => {
  write(
    "debug",
    message,
    meta
  );
};

const info = (
  message,
  meta = {}
) => {
  write(
    "info",
    message,
    meta
  );
};

const warn = (
  message,
  meta = {}
) => {
  write(
    "warn",
    message,
    meta
  );
};

const error = (
  message,
  meta = {}
) => {
  const normalizedMeta = {
    ...meta,
  };

  if (message instanceof Error) {
    normalizedMeta.error =
      serializeError(message);

    message =
      message.message;
  }

  write(
    "error",
    message,
    normalizedMeta
  );
};

const fatal = (
  message,
  meta = {}
) => {
  const normalizedMeta = {
    ...meta,
  };

  if (message instanceof Error) {
    normalizedMeta.error =
      serializeError(message);

    message =
      message.message;
  }

  write(
    "fatal",
    message,
    normalizedMeta
  );
};

const trace = (
  message,
  meta = {}
) => {
  write(
    "trace",
    message,
    meta
  );
};

const child = (
  context = {}
) => {
  return {
    debug: (
      message,
      meta = {}
    ) =>
      debug(message, {
        ...context,
        ...meta,
      }),

    info: (
      message,
      meta = {}
    ) =>
      info(message, {
        ...context,
        ...meta,
      }),

    warn: (
      message,
      meta = {}
    ) =>
      warn(message, {
        ...context,
        ...meta,
      }),

    error: (
      message,
      meta = {}
    ) =>
      error(message, {
        ...context,
        ...meta,
      }),

    fatal: (
      message,
      meta = {}
    ) =>
      fatal(message, {
        ...context,
        ...meta,
      }),

    trace: (
      message,
      meta = {}
    ) =>
      trace(message, {
        ...context,
        ...meta,
      }),
  };
};

const logger = Object.freeze({
  debug,
  info,
  warn,
  error,
  fatal,
  trace,
  child,
  levels: LEVELS,
  currentLevel:
    normalizeLevel(env.LOG_LEVEL),
});

export {
  LEVELS,
  normalizeLevel,
  serializeError,
  shouldLog,
  debug,
  info,
  warn,
  error,
  fatal,
  trace,
  child,
};

export default logger;
