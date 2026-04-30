import { authMiddleware, allowRoles, authorize } from "./auth.js";
import { allowDomains } from "./domain.js";

// helper
const withAuth = (...middlewares) => [authMiddleware, ...middlewares];

// 🔹 admin-level access (common)
export const adminAccess = withAuth(
  allowRoles("admin", "super_admin")
);

// 🔹 education domain (school/college/coaching)
export const educationDomain = [
  allowDomains("school", "college", "coaching"),
];

// 🔹 company domain
export const companyDomain = [
  allowDomains("company"),
];

// 🔹 institute management (education only)
export const manageInstitutes = withAuth(
  allowRoles("admin", "super_admin"),
  allowDomains("school", "college", "coaching"),
  authorize("manage_institutes")
);

// 🔹 company management
export const manageCompany = withAuth(
  allowRoles("admin", "super_admin"),
  allowDomains("company"),
  authorize("manage_staff")
);

// 🔹 super admin only
export const superAdminOnly = withAuth(
  allowRoles("super_admin"),
  authorize("manage_institutes")
);