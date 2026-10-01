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
  requirePermission(
    "organization:manage"
  )
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
    "organization:manage"
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
    "organization:manage"
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
    "employee:manage"
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
    "user:manage"
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
    "student:manage"
  )
);

export const manageTeachers = withAuth(
  requireRole(
    "admin",
    "super_admin"
  ),
  educationDomains,
  requirePermission(
    "teacher:manage"
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
    "class:manage"
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
    "assignment:manage"
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
    "attendance:manage"
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
    "study_material:manage"
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
    "notification:manage"
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
    "leave:manage"
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
    "payroll:manage"
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
    "report:read"
  )
);