import jwt from "jsonwebtoken";
import { User, RolePermissions } from "../models/user.js";
import Institute from "../models/organization.js";

//
// 🔐 AUTH MIDDLEWARE
//
export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, access denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 include instituteId
    const user = await User.findById(decoded.id)
      .select("_id name email role status instituteId")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // 🔥 attach domain (school/company)
    if (user.instituteId) {
      const institute = await Institute.findById(user.instituteId)
        .select("type")
        .lean();

      user.domain = institute?.type; // school / company
    }

    req.user = user;

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

//
// 🛂 ROLE-BASED ACCESS CONTROL
//
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (req.user.role === "super_admin") return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

//
// 🔑 PERMISSION-BASED ACCESS CONTROL
//
export const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (req.user.role === "super_admin") return next();

    const userPermissions = RolePermissions[req.user.role] || [];

    const hasPermission = permissions.some((p) =>
      userPermissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires ${permissions.join(", ")}`,
      });
    }

    next();
  };
};

//
// 🔑 ROLE SHORTCUTS
//
export const isSuperAdmin = allowRoles("super_admin");
export const isAdmin = allowRoles("admin");
export const isTeacher = allowRoles("teacher");
export const isStudent = allowRoles("student");
export const isHR = allowRoles("hr");
export const isEmployee = allowRoles("employee");