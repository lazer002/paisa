import jwt from "jsonwebtoken";
import { User, RolePermissions } from "../models/user.js";
import Organization from "../models/organization.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id name email role status instituteId userCode")
      .lean();

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Account is inactive. Contact your administrator" });
    }

    // Attach organization domain (school / company)
    if (user.instituteId) {
      const org = await Organization.findById(user.instituteId).select("type name").lean();
      user.domain = org?.type;
      user.orgName = org?.name;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired, please log in again" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    // super_admin bypasses all role checks
    if (req.user.role === "super_admin") return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
};

export const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (req.user.role === "super_admin") return next();

    const userPermissions = RolePermissions[req.user.role] || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
};

export const isSuperAdmin = allowRoles("super_admin");
export const isAdmin = allowRoles("admin");
export const isTeacher = allowRoles("teacher");
export const isStudent = allowRoles("student");
export const isHR = allowRoles("hr");
export const isEmployee = allowRoles("employee");
