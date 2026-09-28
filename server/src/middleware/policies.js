// server/src/middleware/policies.js

import authenticate from "./authenticate.js";

import {
  requireRole,
  requirePermission,
} from "./authorize.js";

import { allowDomains } from "./domain.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const withAuth = (...middlewares) => [
  authenticate,
  ...middlewares.filter(Boolean),
];

const educationDomains = allowDomains(
  "school",
  "college",
  "coaching"
);

const companyDomains = allowDomains(
  "company"
);

/* -------------------------------------------------------------------------- */
/* Authentication / role policies                                             */
/* -------------------------------------------------------------------------- */

export const authenticated = withAuth();

export const adminAccess = withAuth(
  requireRole(
    "admin",
    "super_admin"
  )
);

export const superAdminOnly = withAuth(
  requireRole("super_admin"),
  requirePermission("manage_organizations")
);

/* -------------------------------------------------------------------------- */
/* Domain policies                                                            */
/* -------------------------------------------------------------------------- */

export const educationDomain = withAuth(
  educationDomains
);

export const companyDomain = withAuth(
  companyDomains
);

/* -------------------------------------------------------------------------- */
/* Organization management                                                    */
/* -------------------------------------------------------------------------- */

export const manageOrganizations = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_organizations"
  )
);

/* -------------------------------------------------------------------------- */
/* Company management                                                         */
/* -------------------------------------------------------------------------- */

export const manageCompany = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  companyDomains,
  requirePermission(
    "manage_staff"
  )
);

/* -------------------------------------------------------------------------- */
/* Staff / HR policies                                                        */
/* -------------------------------------------------------------------------- */

export const manageStaff = withAuth(
  requireRole(
    "admin",
    "hr",
    "super_admin"
  ),
  requirePermission(
    "manage_staff"
  )
);

export const hrAccess = withAuth(
  requireRole(
    "admin",
    "hr",
    "super_admin"
  )
);

/* -------------------------------------------------------------------------- */
/* Education policies                                                         */
/* -------------------------------------------------------------------------- */

export const teacherAccess = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains
);

export const studentAccess = withAuth(
  requireRole(
    "admin",
    "teacher",
    "student",
    "super_admin"
  ),
  educationDomains
);

export const educationAdminAccess = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  educationDomains
);

/* -------------------------------------------------------------------------- */
/* Employee policies                                                          */
/* -------------------------------------------------------------------------- */

export const employeeAccess = withAuth(
  requireRole(
    "admin",
    "hr",
    "employee",
    "super_admin"
  ),
  companyDomains
);

/* -------------------------------------------------------------------------- */
/* Feature-specific policies                                                  */
/* -------------------------------------------------------------------------- */

export const manageUsers = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  requirePermission(
    "manage_users"
  )
);

export const manageStudents = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_students"
  )
);

export const manageTeachers = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_teachers"
  )
);

export const manageClasses = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_classes"
  )
);

export const manageAssignments = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_assignments"
  )
);

export const manageAttendance = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_attendance"
  )
);

export const manageStudyMaterials = withAuth(
  requireRole(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "manage_materials"
  )
);

export const manageAnnouncements = withAuth(
  requireRole(
    "admin",
    "teacher",
    "hr",
    "super_admin"
  ),
  requirePermission(
    "manage_announcements"
  )
);

export const manageLeaves = withAuth(
  requireRole(
    "admin",
    "hr",
    "employee",
    "super_admin"
  ),
  requirePermission(
    "manage_leaves"
  )
);

export const managePayroll = withAuth(
  requireRole(
    "admin",
    "hr",
    "super_admin"
  ),
  companyDomains,
  requirePermission(
    "manage_payroll"
  )
);

export const viewReports = withAuth(
  requireRole(
    "admin",
    "hr",
    "teacher",
    "super_admin"
  ),
  requirePermission(
    "view_reports"
  )
);