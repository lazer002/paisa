// server/src/middleware/validate.js

import Joi from "joi";
import ApiError from "../utils/ApiError.js";

const DEFAULT_OPTIONS = Object.freeze({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  convert: true,
});

const validateSource = (
  schema,
  source,
  options = {}
) => {
  if (!schema) {
    return source;
  }

  if (
    typeof schema.validate !== "function"
  ) {
    throw new TypeError(
      "Validation schema must be a Joi schema"
    );
  }

  const result = schema.validate(
    source,
    {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  );

  if (result.error) {
    const errors =
      result.error.details.map(
        (detail) => ({
          field: detail.path.join("."),
          message: detail.message,
          type: detail.type,
          value: detail.context?.value,
        })
      );

throw ApiError.unprocessable(
  "Request validation failed",
  {
    code: "VALIDATION_ERROR",
    errors,
  }
);
  }

  return result.value;
};

const validate = ({
  body,
  params,
  query,
  headers,
  cookies,
  options = {},
} = {}) => {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = validateSource(
          body,
          req.body,
          options
        );
      }

      if (params) {
        req.params = validateSource(
          params,
          req.params,
          options
        );
      }

      if (query) {
        req.query = validateSource(
          query,
          req.query,
          options
        );
      }

      if (headers) {
        req.headers = validateSource(
          headers,
          req.headers,
          {
            ...options,
            allowUnknown: true,
          }
        );
      }

      if (cookies) {
        req.cookies = validateSource(
          cookies,
          req.cookies,
          options
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateBody = (
  schema,
  options = {}
) => {
  return validate({
    body: schema,
    options,
  });
};

const validateParams = (
  schema,
  options = {}
) => {
  return validate({
    params: schema,
    options,
  });
};

const validateQuery = (
  schema,
  options = {}
) => {
  return validate({
    query: schema,
    options,
  });
};

const validateHeaders = (
  schema,
  options = {}
) => {
  return validate({
    headers: schema,
    options: {
      ...options,
      allowUnknown: true,
    },
  });
};

const validateCookies = (
  schema,
  options = {}
) => {
  return validate({
    cookies: schema,
    options,
  });
};

const validateRequest = (
  schema,
  options = {}
) => {
  return validate({
    body: schema,
    params: schema,
    query: schema,
    options,
  });
};

const commonSchemas = Object.freeze({
  objectId: Joi.string()
    .trim()
    .length(24)
    .hex(),

  uuid: Joi.string()
    .trim()
    .guid({
      version: [
        "uuidv4",
        "uuidv5",
      ],
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({
      tlds: {
        allow: false,
      },
    })
    .max(254),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-()\s]{7,20}$/),

  password: Joi.string()
    .min(8)
    .max(128),

  positiveInteger: Joi.number()
    .integer()
    .min(1),

  nonNegativeInteger: Joi.number()
    .integer()
    .min(0),

  positiveNumber: Joi.number()
    .greater(0),

  nonNegativeNumber: Joi.number()
    .min(0),

  booleanString: Joi.boolean(),

  date: Joi.date(),

  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),

    sortBy: Joi.string()
      .trim()
      .max(100),

    sortOrder: Joi.string()
      .valid("asc", "desc")
      .default("desc"),
  }),
});

const createValidationError = (
  message = "Request validation failed",
  details = []
) => {
return ApiError.unprocessable(
  message,
  {
    code: "VALIDATION_ERROR",
    errors: details,
  }
);
};

export {
  DEFAULT_OPTIONS,
  validateSource,
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
  validateCookies,
  validateRequest,
  commonSchemas,
  createValidationError,
};

export default validate;
