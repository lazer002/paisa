// server/src/utils/ApiError.js

import { AppError } from "./errorHandler.js";

class ApiError extends AppError {
  constructor(
    message = "An unexpected error occurred",
    statusCode = 500,
    options = {}
  ) {
    super(
      message,
      statusCode,
      options.code || "INTERNAL_ERROR",
      options.details ?? options.errors ?? null
    );

    this.name = "ApiError";

    this.errors = options.errors ?? null;

    this.isOperational =
      options.isOperational !== undefined
        ? Boolean(options.isOperational)
        : true;

    this.expose =
      options.expose !== undefined
        ? Boolean(options.expose)
        : statusCode < 500;

    this.resource = options.resource ?? null;

    this.field = options.field ?? null;

    this.requestId = options.requestId ?? null;

    this.cause = options.cause;
  }

  static badRequest(message = "Bad request", options = {}) {
    return new ApiError(message, 400, {
      ...options,
      code: options.code || "BAD_REQUEST",
    });
  }

  static unauthorized(
    message = "Authentication required",
    options = {}
  ) {
    return new ApiError(message, 401, {
      ...options,
      code: options.code || "AUTHENTICATION_REQUIRED",
    });
  }

  static forbidden(message = "Access denied", options = {}) {
    return new ApiError(message, 403, {
      ...options,
      code: options.code || "ACCESS_DENIED",
    });
  }

  static notFound(
    message = "Resource not found",
    options = {}
  ) {
    return new ApiError(message, 404, {
      ...options,
      code: options.code || "RESOURCE_NOT_FOUND",
    });
  }

  static conflict(
    message = "Resource already exists",
    options = {}
  ) {
    return new ApiError(message, 409, {
      ...options,
      code: options.code || "RESOURCE_EXISTS",
    });
  }

  static unprocessable(
    message = "Request could not be processed",
    options = {}
  ) {
    return new ApiError(message, 422, {
      ...options,
      code: options.code || "VALIDATION_ERROR",
    });
  }

  static tooManyRequests(
    message = "Too many requests",
    options = {}
  ) {
    return new ApiError(message, 429, {
      ...options,
      code: options.code || "RATE_LIMIT_EXCEEDED",
    });
  }

  static internal(
    message = "Internal server error",
    options = {}
  ) {
    return new ApiError(message, 500, {
      ...options,
      code: options.code || "INTERNAL_ERROR",
      isOperational:
        options.isOperational !== undefined
          ? options.isOperational
          : false,
      expose:
        options.expose !== undefined
          ? options.expose
          : false,
    });
  }

  static fromError(error, options = {}) {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError(
      options.message ||
        error?.message ||
        "Internal server error",
      options.statusCode || 500,
      {
        ...options,
        cause: error,
        code:
          options.code ||
          error?.code ||
          "INTERNAL_ERROR",
        isOperational:
          options.isOperational !== undefined
            ? options.isOperational
            : false,
        expose:
          options.expose !== undefined
            ? options.expose
            : false,
      }
    );
  }
}

export default ApiError;