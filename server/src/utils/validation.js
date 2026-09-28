// server/src/utils/validation.js

import Joi from "joi";

const objectId = Joi.string()
  .trim()
  .length(24)
  .hex();

const email = Joi.string()
  .trim()
  .lowercase()
  .email({
    tlds: {
      allow: false,
    },
  })
  .max(254);

const phone = Joi.string()
  .trim()
  .pattern(/^[0-9+\-()\s]{7,20}$/);

const password = Joi.string()
  .min(8)
  .max(128);

const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, "lowercase letter")
  .pattern(/[A-Z]/, "uppercase letter")
  .pattern(/[0-9]/, "number")
  .pattern(
    /[^A-Za-z0-9]/,
    "special character"
  );

const uuid = Joi.string()
  .trim()
  .guid({
    version: [
      "uuidv4",
      "uuidv5",
    ],
  });

const date = Joi.date();

const positiveInteger = Joi.number()
  .integer()
  .min(1);

const nonNegativeInteger = Joi.number()
  .integer()
  .min(0);

const positiveNumber = Joi.number()
  .greater(0);

const nonNegativeNumber = Joi.number()
  .min(0);

const boolean = Joi.boolean();

const pagination = Joi.object({
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

  search: Joi.string()
    .trim()
    .max(200)
    .allow(""),
});

const mongoObjectId = objectId;

const optionalObjectId =
  objectId.allow(null, "");

const nullableDate =
  date.allow(null);

const optionalEmail =
  email.allow(null, "");

const optionalPhone =
  phone.allow(null, "");

const trimmedString = (
  min = 1,
  max = 500
) =>
  Joi.string()
    .trim()
    .min(min)
    .max(max);

const slug = Joi.string()
  .trim()
  .lowercase()
  .pattern(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  )
  .max(200);

const url = Joi.string()
  .trim()
  .uri({
    scheme: [
      "http",
      "https",
    ],
  })
  .max(2048);

const enumValue = (
  values
) =>
  Joi.string()
    .valid(...values);

const arrayOfObjectIds = Joi.array()
  .items(objectId)
  .unique();

const sortOrder = Joi.string()
  .valid("asc", "desc")
  .default("desc");

const paginationQuery = Joi.object({
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

  sortOrder,

  search: Joi.string()
    .trim()
    .max(200)
    .allow(""),
});

const validate = (
  schema,
  value,
  options = {}
) => {
  const result = schema.validate(
    value,
    {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
      ...options,
    }
  );

  return result;
};

const validateOrThrow = (
  schema,
  value,
  options = {}
) => {
  const {
    error,
    value: validatedValue,
  } = validate(
    schema,
    value,
    options
  );

  if (error) {
    const validationError =
      new Error(
        "Validation failed"
      );

    validationError.name =
      "ValidationError";

    validationError.details =
      error.details;

    throw validationError;
  }

  return validatedValue;
};

const formatValidationErrors = (
  error
) => {
  if (!error) {
    return [];
  }

  return error.details.map(
    (detail) => ({
      field:
        detail.path.join("."),
      message:
        detail.message,
      type:
        detail.type,
      value:
        detail.context?.value,
    })
  );
};

const commonSchemas =
  Object.freeze({
    objectId,
    mongoObjectId,
    optionalObjectId,
    uuid,
    email,
    optionalEmail,
    phone,
    optionalPhone,
    password,
    strongPassword,
    date,
    nullableDate,
    positiveInteger,
    nonNegativeInteger,
    positiveNumber,
    nonNegativeNumber,
    boolean,
    pagination,
    paginationQuery,
    trimmedString,
    slug,
    url,
    enumValue,
    arrayOfObjectIds,
    sortOrder,
  });

export {
  objectId,
  mongoObjectId,
  optionalObjectId,
  uuid,
  email,
  optionalEmail,
  phone,
  optionalPhone,
  password,
  strongPassword,
  date,
  nullableDate,
  positiveInteger,
  nonNegativeInteger,
  positiveNumber,
  nonNegativeNumber,
  boolean,
  pagination,
  paginationQuery,
  trimmedString,
  slug,
  url,
  enumValue,
  arrayOfObjectIds,
  sortOrder,
  validate,
  validateOrThrow,
  formatValidationErrors,
  commonSchemas,
};

export default commonSchemas;
