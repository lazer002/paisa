// Standardized API response utility
export const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
    ...(data && { data })
  };
  
  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message, data = null) => {
  return sendResponse(res, 200, true, message, data);
};

export const sendCreated = (res, message, data = null) => {
  return sendResponse(res, 201, true, message, data);
};

export const sendError = (res, statusCode, message) => {
  return sendResponse(res, statusCode, false, message);
};

export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, 404, message);
};

export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, 401, message);
};

export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, 403, message);
};

export const sendValidationError = (res, message = 'Validation failed') => {
  return sendError(res, 400, message);
};
