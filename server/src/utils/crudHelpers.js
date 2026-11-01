import ApiError from "./ApiError.js";
import { hasPermission } from "./permissions.js";

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

/**
 * Managers (holders of `permission`) may change any record; everyone else
 * only the records they created. Routes using this admit the create
 * permission too, so creators can edit/delete their own work.
 */
export const assertOwnerOrPermission = (req, doc, permission) => {
  if (hasPermission(req.user, permission)) return;

  if (String(doc?.createdBy?._id ?? doc?.createdBy) === String(req.user._id)) {
    return;
  }

  throw ApiError.forbidden("You can only change what you created", {
    code: "NOT_OWNER",
  });
};

export const requireInstitute = (req) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest("Institute context required");
  }

  return req.user.instituteId;
};
