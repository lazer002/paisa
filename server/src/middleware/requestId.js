// server/src/middleware/requestId.js

import crypto from "node:crypto";

const REQUEST_ID_HEADER = "X-Request-ID";

const generateRequestId = () => {
  return `req_${crypto.randomUUID()}`;
};

const requestIdMiddleware = (req, res, next) => {
  const incomingRequestId =
    req.get(REQUEST_ID_HEADER);

  const requestId =
    incomingRequestId?.trim() ||
    generateRequestId();

  req.requestId = requestId;

  res.setHeader(
    REQUEST_ID_HEADER,
    requestId
  );

  next();
};

export {
  REQUEST_ID_HEADER,
  generateRequestId,
};

export default requestIdMiddleware;
