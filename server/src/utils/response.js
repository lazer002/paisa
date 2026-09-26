// server/src/utils/response.js

const sendSuccess = (
  res,
  {
    data = null,
    message = "Success",
    statusCode = 200,
    meta = null,
  } = {}
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendCreated = (
  res,
  {
    data = null,
    message = "Created successfully",
    meta = null,
  } = {}
) => {
  return sendSuccess(res, {
    data,
    message,
    statusCode: 201,
    meta,
  });
};

const sendNoContent = (res) => {
  return res.status(204).send();
};

const sendError = (
  res,
  {
    message = "Something went wrong",
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details = null,
  } = {}
) => {
  const response = {
    success: false,
    message,
    code,
  };

  if (details !== null) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

const sendBadRequest = (
  res,
  message = "Bad request",
  details = null
) => {
  return sendError(res, {
    message,
    statusCode: 400,
    code: "BAD_REQUEST",
    details,
  });
};

const sendUnauthorized = (
  res,
  message = "Authentication required"
) => {
  return sendError(res, {
    message,
    statusCode: 401,
    code: "UNAUTHORIZED",
  });
};

const sendForbidden = (
  res,
  message = "You do not have permission to perform this action"
) => {
  return sendError(res, {
    message,
    statusCode: 403,
    code: "FORBIDDEN",
  });
};

const sendNotFound = (
  res,
  message = "Resource not found"
) => {
  return sendError(res, {
    message,
    statusCode: 404,
    code: "NOT_FOUND",
  });
};

const sendConflict = (
  res,
  message = "Resource already exists",
  details = null
) => {
  return sendError(res, {
    message,
    statusCode: 409,
    code: "CONFLICT",
    details,
  });
};

const sendValidationError = (
  res,
  message = "Validation failed",
  details = null
) => {
  return sendError(res, {
    message,
    statusCode: 422,
    code: "VALIDATION_ERROR",
    details,
  });
};

const sendPaginated = (
  res,
  {
    data = [],
    page = 1,
    limit = 20,
    total = 0,
    message = "Data fetched successfully",
  } = {}
) => {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, {
    data,
    message,
    meta: {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPreviousPage: Number(page) > 1,
      },
    },
  });
};

export {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendPaginated,
};