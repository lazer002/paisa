// server/src/services/passwordResetService.js
//
// Single-use, hashed, expiring password reset tokens.
//
// - The raw token only ever leaves the server inside the emailed link.
// - The User stores sha256(token) in `resetTokenHash` + `resetTokenExpiresAt`.
// - Consuming a token is one atomic findOneAndUpdate on the hash, so a token
//   can never be used twice (even by concurrent requests).
// - A successful reset revokes every refresh session of the user.

import env from "../config/env.js";
import logger from "../config/logger.js";
import { User } from "../models/User.js";
import RefreshSession from "../models/RefreshSession.js";
import Organization from "../models/organization.js";
import ApiError from "../utils/ApiError.js";
import {
  createPasswordResetToken,
  hash,
} from "../utils/crypto.js";
import { hashPassword } from "../utils/password.js";
import { sendEmail } from "./emailService.js";
import {
  appUrl,
  passwordResetEmail,
  welcomeEmail,
} from "./emailTemplates.js";

/** Forgot-password links: PASSWORD_RESET_TTL_SECONDS (default 15 min). */
export const RESET_TTL_SECONDS = Math.max(
  Number(env.PASSWORD_RESET_TTL_SECONDS) || 900,
  60
);

/** Set-password links in welcome emails stay valid longer. */
export const WELCOME_TTL_SECONDS = 72 * 60 * 60;

export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

const ACTIVE_STATUSES = ["active", "verified"];

const resetLink = (token) =>
  appUrl(`/reset-password?token=${encodeURIComponent(token)}`);

/**
 * Create a new token for `userId` (replacing any previous one) and return
 * the raw token. Uses updateOne so the User pre-save hooks do not run.
 */
export const issueResetToken = async (
  userId,
  ttlSeconds = RESET_TTL_SECONDS
) => {
  const token = createPasswordResetToken();
  const now = Date.now();

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        resetTokenHash: hash(token),
        resetTokenExpiresAt: new Date(now + ttlSeconds * 1000),
        resetTokenRequestedAt: new Date(now),
      },
    }
  );

  return token;
};

/**
 * Forgot password. Never reveals whether the email exists: unknown,
 * deleted and inactive accounts silently get nothing.
 */
export const requestPasswordReset = async (email) => {
  const normalized = String(email || "").trim().toLowerCase();

  if (!normalized) return;

  const user = await User.findOne({
    email: normalized,
    isDeleted: { $ne: true },
  }).select("_id name email status deletedAt");

  if (
    !user ||
    user.deletedAt ||
    !ACTIVE_STATUSES.includes(String(user.status || "active").toLowerCase())
  ) {
    logger.info("Password reset requested for unknown or inactive account");
    return;
  }

  const token = await issueResetToken(user._id, RESET_TTL_SECONDS);

  const message = passwordResetEmail({
    name: user.name,
    resetUrl: resetLink(token),
    expiresInMinutes: Math.round(RESET_TTL_SECONDS / 60),
  });

  await sendEmail({ to: user.email, ...message });
};

/**
 * Reset the password with a token. Throws 400 INVALID_RESET_TOKEN for an
 * unknown, expired or already used token.
 */
export const resetPasswordWithToken = async ({ token, password }) => {
  const invalid = () =>
    ApiError.badRequest(
      "This reset link is invalid or has expired. Request a new one.",
      { code: "INVALID_RESET_TOKEN" }
    );

  if (!token || typeof token !== "string") {
    throw invalid();
  }

  const tokenHash = hash(token.trim());
  const passwordHash = await hashPassword(String(password));

  // One second back so a session issued right after (iat in whole
  // seconds) is not rejected as older than the password change.
  const changedAt = new Date(Date.now() - 1000);

  const user = await User.findOneAndUpdate(
    {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
      isDeleted: { $ne: true },
      status: { $in: ACTIVE_STATUSES },
    },
    {
      $set: {
        passwordHash,
        passwordChangedAt: changedAt,
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        resetTokenRequestedAt: null,
      },
    },
    { new: true }
  ).select("_id email");

  if (!user) {
    throw invalid();
  }

  await RefreshSession.revokeUserSessions(user._id, "password_change");

  logger.info("Password reset completed", { userId: String(user._id) });

  return user;
};

/**
 * Welcome email for a newly created account, with a set-password link
 * (preferred over emailing a password). Never throws.
 */
export const sendWelcomeEmail = async ({
  userId,
  name,
  email,
  role,
  organizationName,
  instituteId,
}) => {
  try {
    let orgName = organizationName;

    if (!orgName && instituteId) {
      const org = await Organization.findById(instituteId)
        .select("name")
        .lean();

      orgName = org?.name;
    }

    const token = await issueResetToken(userId, WELCOME_TTL_SECONDS);

    const message = welcomeEmail({
      name,
      email,
      role,
      organizationName: orgName,
      setPasswordUrl: resetLink(token),
      expiresInHours: Math.round(WELCOME_TTL_SECONDS / 3600),
    });

    return await sendEmail({ to: email, ...message });
  } catch (error) {
    logger.error("Welcome email failed", { error: error?.message });
    return { delivered: false, error: error?.message };
  }
};

export default {
  RESET_TTL_SECONDS,
  WELCOME_TTL_SECONDS,
  FORGOT_PASSWORD_MESSAGE,
  issueResetToken,
  requestPasswordReset,
  resetPasswordWithToken,
  sendWelcomeEmail,
};
