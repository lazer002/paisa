import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { AppError, asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, instituteId } = req.body;

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, 400, "User already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    instituteId: instituteId || null,
  });

  // Remove password before sending response
  const { passwordHash: _, ...safeUser } = user.toObject();

  sendCreated(res, "User registered successfully", safeUser);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return sendError(res, 401, "Invalid credentials");
  }

  // Check if user is active
  if (user.status !== 'active') {
    return sendError(res, 401, "Account is inactive");
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    // Increment failed attempts
    user.failedAttempts += 1;
    await user.save();
    return sendError(res, 401, "Invalid credentials");
  }

  // Reset failed attempts on successful login
  user.failedAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Set secure cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Remove password before sending response
  const { passwordHash: _, ...safeUser } = user.toObject();

  sendSuccess(res, "Login successful", { user: safeUser, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  sendSuccess(res, "Logged out successfully");
});

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('instituteId', 'name type');
  sendSuccess(res, "Profile retrieved successfully", user);
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profile } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, profile },
    { new: true, runValidators: true }
  );

  sendSuccess(res, "Profile updated successfully", user);
});
