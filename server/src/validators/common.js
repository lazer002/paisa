// server/src/validators/common.js
//
// Shared building blocks for the per-domain body validators (H3).
//
// Policy: validators check the fields a controller actually reads (types,
// enums, lengths, required) and leave every other key untouched. Clients send
// extra keys today and controllers whitelist what they persist, so unknown
// keys are neither rejected nor stripped. Optional fields accept "" and null
// because the UI forms send cleared inputs that way.

import Joi from "joi";

import { validateBody } from "../middleware/validate.js";

/** Body validator that keeps unknown keys (see policy above). */
export const body = (schema) =>
  validateBody(schema, {
    allowUnknown: true,
    stripUnknown: false,
  });

/** Trimmed string, required unless `.optional()` is applied by the caller. */
export const str = (max = 200, min = 1) =>
  Joi.string().trim().min(min).max(max);

/** Optional trimmed string that also accepts "" and null. */
export const optStr = (max = 200) =>
  Joi.string().trim().max(max).allow("", null);

/** Long free text (descriptions, notes, bodies). */
export const text = (max = 10000) =>
  Joi.string().max(max).allow("", null);

/** A publicId (`cls_…`) or a 24-hex ObjectId sent as a reference. */
export const ref = () =>
  Joi.string().trim().min(1).max(100);

export const optRef = () => ref().allow("", null);

export const refList = (max = 500) =>
  Joi.array().items(ref()).max(max);

export const email = () =>
  Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254);

export const optEmail = () => email().allow("", null);

export const phone = () =>
  Joi.string().trim().max(30).allow("", null);

/** ISO-8601 date/datetime; the original string is passed on unchanged. */
export const isoDate = () => Joi.date().iso().raw();

export const optDate = () => isoDate().allow("", null);

/** "HH:mm" (optionally ":ss"). */
export const time = () =>
  Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .allow("", null);

export const num = (min = 0) => Joi.number().min(min);

export const optNum = (min = 0) => num(min).allow(null, "");

export const int = (min = 0) => Joi.number().integer().min(min);

export const optInt = (min = 0) => int(min).allow(null, "");

export const bool = () => Joi.boolean();

export const url = () =>
  Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(2048)
    .allow("", null);

/** Enum; `values` may be an array or an object of constants. */
export const oneOf = (values) =>
  Joi.string()
    .trim()
    .valid(
      ...(Array.isArray(values)
        ? values
        : Object.values(values))
    );

export const optOneOf = (values) =>
  oneOf(values).allow("", null);

export const strList = (itemMax = 100, max = 200) =>
  Joi.array().items(Joi.string().trim().max(itemMax)).max(max);

/** Plain JSON object (metadata, settings, filters). */
export const obj = () => Joi.object().unknown(true);

export const optObj = () => obj().allow(null);

/** Body must have at least one key (PUT/PATCH updates). */
export const nonEmpty = (schema) =>
  schema.min(1).messages({
    "object.min": "Request body must contain at least one field",
  });

export { Joi };
