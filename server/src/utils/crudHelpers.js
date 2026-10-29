import ApiError from "./ApiError.js";

/**
 * Keep only the listed keys that the client actually sent.
 * Empty strings become null so clearing an optional field (an email or
 * phone) does not trip the format validators.
 */
export const pickFields = (body, allowed) => {
  const picked = {};

  for (const key of allowed) {
    if (body?.[key] !== undefined) {
      picked[key] = body[key] === "" ? null : body[key];
    }
  }

  return picked;
};

/** Tenant filter: super_admin sees everything, others their institute. */
export const tenantScope = (req, extra = {}) =>
  req.user.role === "super_admin"
    ? { isDeleted: { $ne: true }, ...extra }
    : {
        instituteId: req.user.instituteId,
        isDeleted: { $ne: true },
        ...extra,
      };

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const requireInstitute = (req) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest("Institute context required");
  }

  return req.user.instituteId;
};
