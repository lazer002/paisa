// server/src/utils/response.js

import ApiResponse from "./ApiResponse.js";

/* ----------------------------------------------------------------------------
 * Dual-signature support.
 *
 * Older controllers call the helpers positionally:
 *   sendSuccess(res, "Users fetched", users)
 *   sendError(res, 400, "Missing required fields")
 *   sendForbidden(res, "Access denied")
 *
 * Newer controllers pass an options object:
 *   sendSuccess(res, { message, data, meta })
 *   sendError(res, { message, statusCode, code })
 *
 * The helpers below accept BOTH so the codebase can migrate gradually.
 * -------------------------------------------------------------------------- */

const isOptionsObject = (
  value
) =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value);

const sendSuccess = (
  res,
  optionsOrMessage,
  maybeData,
  maybeMeta
) => {
  const options = isOptionsObject(
    optionsOrMessage
  )
    ? optionsOrMessage
    : {
        message:
          optionsOrMessage ??
          "Request successful",

        data:
          maybeData === undefined
            ? null
            : maybeData,

        meta: maybeMeta ?? null,
      };

  const response =
    new ApiResponse({
      success: true,
      statusCode: options.statusCode ?? 200,
      message: options.message ?? "Request successful",
      data: options.data ?? null,
      meta: options.meta ?? null,
      requestId:
        options.requestId ||
        res.req?.requestId ||
        null,
    });

  return res
    .status(options.statusCode ?? 200)
    .json(response.toJSON());
};

const sendCreated = (
  res,
  optionsOrMessage,
  maybeData,
  maybeMeta
) => {
  const options = isOptionsObject(
    optionsOrMessage
  )
    ? optionsOrMessage
    : {
        message:
          optionsOrMessage ??
          "Resource created successfully",

        data:
          maybeData === undefined
            ? null
            : maybeData,

        meta: maybeMeta ?? null,
      };

  return sendSuccess(res, {
    ...options,

    statusCode:
      options.statusCode ?? 201,
  });
};

const sendAccepted = (
  res,
  optionsOrMessage,
  maybeData,
  maybeMeta
) => {
  const options = isOptionsObject(
    optionsOrMessage
  )
    ? optionsOrMessage
    : {
        message:
          optionsOrMessage ??
          "Request accepted",

        data:
          maybeData === undefined
            ? null
            : maybeData,

        meta: maybeMeta ?? null,
      };

  return sendSuccess(res, {
    ...options,

    statusCode:
      options.statusCode ?? 202,
  });
};

const sendForbidden = (
  res,
  message = "Forbidden",
  options = {}
) => {
  return sendError(res, {
    message,

    statusCode: 403,

    ...options,
  });
};

const sendNotFound = (
  res,
  message = "Resource not found",
  options = {}
) => {
  return sendError(res, {
    message,

    statusCode: 404,

    ...options,
  });
};

const sendNoContent = (res) => {
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
  optionsOrMessage,
  statusCodeOrMessage,
  codeOrOptions
) => {
  let options;

  if (isOptionsObject(optionsOrMessage)) {
    options = optionsOrMessage;
  } else if (
    typeof optionsOrMessage === "number"
  ) {
    // Legacy: sendError(res, statusCode, message, options?)
    options = {
      statusCode:
        optionsOrMessage,

      message: statusCodeOrMessage,

      ...(isOptionsObject(codeOrOptions)
        ? codeOrOptions
        : {}),
    };
  } else {
    // Legacy: sendError(res, message, statusCode?, options?)
    options = {
      message: optionsOrMessage,

      statusCode:
        typeof statusCodeOrMessage === "number"
          ? statusCodeOrMessage
          : 500,

      ...(isOptionsObject(
        typeof statusCodeOrMessage === "object"
          ? statusCodeOrMessage
          : codeOrOptions
      )
        ? isOptionsObject(statusCodeOrMessage)
          ? statusCodeOrMessage
          : codeOrOptions
        : {}),
    };
  }

  const body = {
    success: false,

    statusCode:
      options.statusCode ?? 500,

    code:
      options.code ?? "INTERNAL_SERVER_ERROR",

    message:
      options.message ?? "Request failed",

    errors:
      options.errors ?? null,

    details:
      options.details ?? null,

    requestId:
      options.requestId ||
      res.req?.requestId ||
      null,
  };

  return res
    .status(body.statusCode)
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
