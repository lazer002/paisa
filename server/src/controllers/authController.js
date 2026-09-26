import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.js";
import RefreshSession from "../models/RefreshSession.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from "../middleware/auth.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProd = () => process.env.NODE_ENV === "production";

// ─── Refresh session lifecycle ───────────────────────────────────────────────

const issueRefreshSession = async (req, user, familyId = null) => {
  const raw = generateRefreshToken();

  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(raw),
    familyId: familyId || crypto.randomUUID(),
    userAgent: req.headers["user-agent"]?.slice(0, 255),
    ip: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return raw;
};

const setRefreshCookie = (res, raw) => {
  // httpOnly: JavaScript can NEVER read this cookie — XSS cannot steal it.
  // secure: only sent over HTTPS in production. sameSite=strict: CSRF-proof.
  res.cookie("refreshToken", raw, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/api/auth", // only ever sent to auth endpoints
    maxAge: REFRESH_TTL_MS,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/api/auth",
  });
};

/**
 * Rotate: consume the presented refresh token, issue a new one.
 * If an already-rotated token is reused → session theft → kill the family.
 */
const rotateRefreshSession = async (req, res, session) => {
  if (!session.isActive()) {
    return null;
  }

  // Reuse detection: this hash was already rotated out once
  if (session.previousHash && session.tokenHash !== hashToken(req.cookies.refreshToken)) {
    return null;
  }

  const raw = generateRefreshToken();

  session.previousHash = session.tokenHash;
  session.tokenHash = hashToken(raw);
  session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  session.userAgent = req.headers["user-agent"]?.slice(0, 255);
  session.ip = req.ip;
  await session.save();

  setRefreshCookie(res, raw);
  return raw;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, instituteId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return sendError(res, 400, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    instituteId: instituteId || null,
  });

  const accessToken = signAccessToken(user);

  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  sendCreated(res, "Account created successfully", { user: safeUser, accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash +failedAttempts +lockedUntil"
  );
  if (!user) {
    // Generic message — don't reveal if email exists
    return sendError(res, 401, "Invalid email or password");
  }

  // Account lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
    return sendError(res, 403, `Account locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`);
  }

  if (user.status !== "active") {
    return sendError(res, 403, "Your account has been deactivated. Contact your administrator");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;

    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedAttempts = 0;
      await user.save();
      return sendError(res, 403, "Too many failed attempts. Account locked for 30 minutes");
    }

    const remaining = MAX_FAILED_ATTEMPTS - user.failedAttempts;
    await user.save();
    return sendError(res, 401, `Invalid email or password. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining`);
  }

  // Successful login — reset lockout
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshSession(req, user);
  setRefreshCookie(res, refreshToken);

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.failedAttempts;
  delete safeUser.lockedUntil;

  sendSuccess(res, "Login successful", { user: safeUser, accessToken });
});

/**
 * Silent refresh: exchange the httpOnly cookie for a fresh access token.
 * The access token lives only in client memory — never in storage.
 */
export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) return sendError(res, 401, "No refresh token");

  const session = await RefreshSession.findOne({ tokenHash: hashToken(raw) });

  if (!session) {
    clearRefreshCookie(res);
    return sendError(res, 401, "Invalid session");
  }

  if (!session.isActive()) {
    clearRefreshCookie(res);
    return sendError(res, 401, "Session expired, please log in again");
  }

  // Reuse detection — a rotated token was presented again → theft → kill family
  if (session.previousHash && session.tokenHash !== hashToken(raw)) {
    await RefreshSession.updateMany(
      { familyId: session.familyId },
      { $set: { revokedAt: new Date() } }
    );
    clearRefreshCookie(res);
    return sendError(res, 401, "Session compromised. Please log in again");
  }

  const user = await User.findById(session.userId).select("_id name email role status instituteId userCode");
  if (!user || user.status !== "active") {
    await RefreshSession.updateMany(
      { familyId: session.familyId },
      { $set: { revokedAt: new Date() } }
    );
    clearRefreshCookie(res);
    return sendError(res, 401, "Account unavailable");
  }

  const newRaw = await rotateRefreshSession(req, res, session);
  if (!newRaw) {
    clearRefreshCookie(res);
    return sendError(res, 401, "Session expired, please log in again");
  }

  const accessToken = signAccessToken(user);
  sendSuccess(res, "Token refreshed", { accessToken, user });
});

/**
 * Logout current device: revoke the presented session.
 */
export const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (raw) {
    await RefreshSession.updateOne(
      { tokenHash: hashToken(raw) },
      { $set: { revokedAt: new Date() } }
    );
  }
  clearRefreshCookie(res);
  sendSuccess(res, "Logged out successfully");
});

/**
 * Nuke every session for the current user — all devices.
 * Called by: client "logout everywhere", or automatically on password change.
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await RefreshSession.updateMany(
    { userId: req.user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  clearRefreshCookie(res);
  sendSuccess(res, "Logged out from all devices");
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("instituteId", "name type");
  if (!user) return sendError(res, 404, "User not found");
  sendSuccess(res, "Profile retrieved", user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profile, currentPassword, newPassword } = req.body;

  // Password change requires the current password — and kills all sessions
  if (newPassword) {
    const me = await User.findById(req.user._id).select("+passwordHash");
    const ok = await bcrypt.compare(currentPassword || "", me.passwordHash);
    if (!ok) return sendError(res, 401, "Current password is incorrect");

    me.passwordHash = await bcrypt.hash(newPassword, 12);
    await me.save();

    // If someone changed your password, your other sessions must die
    await RefreshSession.updateMany(
      { userId: req.user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    const user = await User.findById(req.user._id).select("-passwordHash");
    return sendSuccess(res, "Password changed. Please log in again on other devices", user);
  }

  // Only allow safe fields — never allow role/status/instituteId change via profile endpoint
  const updates = {};
  if (name) updates.name = name;
  if (profile) updates.profile = profile;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, "Profile updated", user);
});
