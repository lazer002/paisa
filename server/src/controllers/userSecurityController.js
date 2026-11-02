// server/src/controllers/userSecurityController.js
//
// Account security actions a manager takes for someone else: reset their
// two-factor sign-in (lost phone), list their signed-in devices and sign them
// out everywhere. Gated by user:update; the target must be in the caller's
// organization and below the caller's role (super_admin: anyone).

import { User } from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";

import { ROLES } from "../config/constants.js";
import { emit } from "../realtime/emitter.js";
import authService from "../services/authService.js";
import { disable as disableTwoFactor } from "../services/twoFactorService.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { canManageRole } from "../utils/permissions.js";
import { sendSuccess } from "../utils/response.js";

const loadManagedTarget = async (req) => {
  const target = await User.findOne({ publicId: req.params.publicId }).select(
    "_id publicId name role instituteId twoFactorEnabled"
  );

  if (!target) {
    throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  }

  if (String(target._id) === String(req.user._id)) {
    throw ApiError.badRequest("Use your own Settings page for your account", "USE_OWN_SETTINGS");
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    const sameOrg = String(target.instituteId ?? "") === String(req.user.instituteId ?? "");

    if (!sameOrg || !canManageRole(req.user.role, target.role)) {
      throw ApiError.forbidden("You cannot manage this user's security", "ACCESS_DENIED");
    }
  }

  return target;
};

export const resetUserTwoFactor = asyncHandler(async (req, res) => {
  const target = await loadManagedTarget(req);

  await disableTwoFactor(target._id);

  // Whoever holds the lost device must sign in again.
  await RefreshSession.revokeUserSessions(target._id, "admin_revoke");
  emit.disconnectUser(target._id);

  return sendSuccess(res, {
    message: `Two-factor sign-in reset for ${target.name}. They can sign in with their password and set it up again`,
    data: { enabled: false },
  });
});

export const getUserSessions = asyncHandler(async (req, res) => {
  const target = await loadManagedTarget(req);

  return sendSuccess(res, {
    message: "Active sessions",
    data: {
      twoFactorEnabled: Boolean(target.twoFactorEnabled),
      sessions: await authService.listSessions({ userId: target._id }),
    },
  });
});

export const revokeUserSessions = asyncHandler(async (req, res) => {
  const target = await loadManagedTarget(req);

  await RefreshSession.revokeUserSessions(target._id, "admin_revoke");
  emit.disconnectUser(target._id);

  return sendSuccess(res, {
    message: `${target.name} has been signed out everywhere`,
    data: null,
  });
});
