// server/src/utils/errorHandler.js

class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details = null) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const normalizeError = (err) => {
  if (err instanceof AppError) {
    return err;
  }

  if (err?.name === "ValidationError") {
    const details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return new AppError(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      details
    );
  }

  if (err?.name === "CastError") {
    return new AppError(
      `Invalid ${err.path}`,
      400,
      "INVALID_ID"
    );
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});

    return new AppError(
      fields.length
        ? `${fields.join(", ")} already exists`
        : "Duplicate resource",
      409,
      "DUPLICATE_RESOURCE",
      {
        fields,
      }
    );
  }

  if (err?.name === "JsonWebTokenError") {
    return new AppError(
      "Invalid authentication token",
      401,
      "INVALID_TOKEN"
    );
  }

  if (err?.name === "TokenExpiredError") {
    return new AppError(
      "Authentication token expired",
      401,
      "TOKEN_EXPIRED"
    );
  }

  return new AppError(
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err?.message || "Internal server error",
    500,
    "INTERNAL_SERVER_ERROR"
  );
};

const globalErrorHandler = (err, req, res, next) => {
  const error = normalizeError(err);

  const statusCode = error.statusCode || 500;

  const response = {
    success: false,
    message: error.message,
    code: error.code,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  console.error(
    `[${new Date().toISOString()}]`,
    req.method,
    req.originalUrl,
    statusCode,
    error.message
  );

  res.status(statusCode).json(response);
};

const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export {
  AppError,
  asyncHandler,
  globalErrorHandler,
};

export default globalErrorHandler;