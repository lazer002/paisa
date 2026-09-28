// server/src/utils/asyncHandler.js

const asyncHandler = (handler) => {
  if (typeof handler !== "function") {
    throw new TypeError(
      "asyncHandler requires a function"
    );
  }

  return function wrappedAsyncHandler(req, res, next) {
    try {
      const result = handler(req, res, next);

      if (
        result &&
        typeof result.then === "function"
      ) {
        result.catch(next);
      }
    } catch (error) {
      next(error);
    }
  };
};

export const asyncHandlerWithContext = (handler) => {
  if (typeof handler !== "function") {
    throw new TypeError(
      "asyncHandlerWithContext requires a function"
    );
  }

  return async function wrappedAsyncHandler(
    req,
    res,
    next
  ) {
    try {
      return await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default asyncHandler;
