import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

// ✅ Auth middleware (verify token)
export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (excluding passwordHash)
    req.user = await User.findById(decoded.id).select("-passwordHash");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

//
// ✅ Role-based middleware (supports multiple roles, super_admin override)
//
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Super admin bypass
    if (req.user.role === "super_admin") return next();

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res
      .status(403)
      .json({ message: `Access denied. Allowed roles: ${roles.join(", ")}` });
  };
};

// 🔑 Specific helpers
export const isSuperAdmin = allowRoles("super_admin");
export const isAdmin = allowRoles("admin");
export const isTeacher = allowRoles("teacher");
export const isStudent = allowRoles("student");
export const isHR = allowRoles("hr");
export const isEmployee = allowRoles("employee");
