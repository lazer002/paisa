import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const setCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

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

  const token = signToken(user);
  setCookie(res, token);

  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  sendCreated(res, "Account created successfully", { user: safeUser, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
console.log("Login attempt for email:", email,password);
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash +failedAttempts +lockedUntil");
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

  const token = signToken(user);
  setCookie(res, token);

  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.failedAttempts;
  delete safeUser.lockedUntil;

  sendSuccess(res, "Login successful", { user: safeUser, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  sendSuccess(res, "Logged out successfully");
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("instituteId", "name type");
  if (!user) return sendError(res, 404, "User not found");
  sendSuccess(res, "Profile retrieved", user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profile } = req.body;

  // Only allow safe fields — never allow role/status/instituteId change via profile endpoint
  const updates = {};
  if (name) updates.name = name;
  if (profile) updates.profile = profile;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  sendSuccess(res, "Profile updated", user);
});
