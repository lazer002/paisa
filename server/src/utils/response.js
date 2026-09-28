// server/src/utils/response.js

import ApiResponse from "./ApiResponse.js";

const sendSuccess = (
  res,
  {
    data = null,
    message = "Request successful",
    statusCode = 200,
    meta = null,
    requestId = null,
  } = {}
) => {
  const response =
    new ApiResponse({
      success: true,
      statusCode,
      message,
      data,
      meta,
      requestId:
        requestId ||
        res.req?.requestId ||
        null,
    });

  return res
    .status(statusCode)
    .json(response.toJSON());
};

const sendForbidden = (
  res,
  message = "Forbidden",
  options = {}
) => {
  return sendError(
    res,
    message,
    403,
    options
  );
};

const sendNotFound = (
  res,
  message = "Resource not found",
  options = {}
) => {
  return sendError(
    res,
    message,
    404,
    options
  );
};

const sendCreated = (
  res,
  {
    data = null,
    message = "Resource created successfully",
    meta = null,
    requestId = null,
  } = {}
) => {
  return sendSuccess(res, {
    data,
    message,
    statusCode: 201,
    meta,
    requestId,
  });
};

const sendAccepted = (
  res,
  {
    data = null,
    message = "Request accepted",
    meta = null,
    requestId = null,
  } = {}
) => {
  return sendSuccess(res, {
    data,
    message,
    statusCode: 202,
    meta,
    requestId,
  });
};

const sendNoContent = (
  res
) => {
  return res.status(204).send();
};

const sendPaginated = (
  res,
  {
    data = [],
    pagination = {},
    message = "Request successful",
    meta = null,
    statusCode = 200,
    requestId = null,
  } = {}
) => {
  const response =
    new ApiResponse({
      success: true,
      statusCode,
      message,
      data,
      meta,
      pagination,
      requestId:
        requestId ||
        res.req?.requestId ||
        null,
    });

  return res
    .status(statusCode)
    .json(response.toJSON());
};

const sendError = (
  res,
  {
    message = "Request failed",
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    errors = null,
    details = null,
    requestId = null,
  } = {}
) => {
  const body = {
    success: false,
    statusCode,
    code,
    message,
    errors,
    details,
    requestId:
      requestId ||
      res.req?.requestId ||
      null,
  };

  return res
    .status(statusCode)
    .json(body);
};

const responseMethods = (
  req,
  res,
  next
) => {
  res.success = (options = {}) =>
    sendSuccess(res, {
      ...options,
      requestId:
        options.requestId ||
        req.requestId,
    });

  res.created = (options = {}) =>
    sendCreated(res, {
      ...options,
      requestId:
        options.requestId ||
        req.requestId,
    });

  res.accepted = (options = {}) =>
    sendAccepted(res, {
      ...options,
      requestId:
        options.requestId ||
        req.requestId,
    });

  res.noContent = () =>
    sendNoContent(res);

  res.paginated = (
    options = {}
  ) =>
    sendPaginated(res, {
      ...options,
      requestId:
        options.requestId ||
        req.requestId,
    });

  res.error = (options = {}) =>
    sendError(res, {
      ...options,
      requestId:
        options.requestId ||
        req.requestId,
    });

  next();
};

export {
  sendSuccess,
  sendCreated,
  sendAccepted,
  sendNoContent,
  sendPaginated,
  sendError,
  responseMethods,
  sendForbidden,
  sendNotFound
};

export default responseMethods;
