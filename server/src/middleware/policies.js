// server/src/middleware/policies.js

import {
  authMiddleware,
  allowRoles,
  authorize,
} from "./auth.js";

import { allowDomains } from "./domain.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const withAuth = (...middlewares) => [
  authMiddleware,
  ...middlewares,
];

const educationDomains = allowDomains(
  "school",
  "college",
  "coaching"
);

const companyDomains = allowDomains("company");

/* -------------------------------------------------------------------------- */
/* Authentication / role policies                                             */
/* -------------------------------------------------------------------------- */

export const authenticated = withAuth();

export const adminAccess = withAuth(
  allowRoles("admin", "super_admin")
);

export const superAdminOnly = withAuth(
  allowRoles("super_admin"),
  authorize("manage_organizations")
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
  allowRoles("admin", "super_admin"),
  educationDomains,
  authorize("manage_organizations")
);

/* -------------------------------------------------------------------------- */
/* Company management                                                         */
/* -------------------------------------------------------------------------- */

export const manageCompany = withAuth(
  allowRoles("admin", "super_admin"),
  companyDomains,
  authorize("manage_staff")
);

/* -------------------------------------------------------------------------- */
/* Staff / HR policies                                                        */
/* -------------------------------------------------------------------------- */

export const manageStaff = withAuth(
  allowRoles("admin", "hr", "super_admin"),
  authorize("manage_staff")
);

export const hrAccess = withAuth(
  allowRoles("admin", "hr", "super_admin")
);

/* -------------------------------------------------------------------------- */
/* Education policies                                                         */
/* -------------------------------------------------------------------------- */

export const teacherAccess = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains
);

export const studentAccess = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "student",
    "super_admin"
  ),
  educationDomains
);

export const educationAdminAccess = withAuth(
  allowRoles("admin", "super_admin"),
  educationDomains
);

/* -------------------------------------------------------------------------- */
/* Employee policies                                                         */
/* -------------------------------------------------------------------------- */

export const employeeAccess = withAuth(
  allowRoles(
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
  allowRoles("admin", "super_admin"),
  authorize("manage_users")
);

export const manageStudents = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  authorize("manage_students")
);

export const manageTeachers = withAuth(
  allowRoles("admin", "super_admin"),
  educationDomains,
  authorize("manage_teachers")
);

export const manageClasses = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  authorize("manage_classes")
);

export const manageAssignments = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  authorize("manage_assignments")
);

export const manageAttendance = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  authorize("manage_attendance")
);

export const manageStudyMaterials = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "super_admin"
  ),
  educationDomains,
  authorize("manage_materials")
);

export const manageAnnouncements = withAuth(
  allowRoles(
    "admin",
    "teacher",
    "hr",
    "super_admin"
  ),
  authorize("manage_announcements")
);

export const manageLeaves = withAuth(
  allowRoles(
    "admin",
    "hr",
    "employee",
    "super_admin"
  ),
  authorize("manage_leaves")
);

export const managePayroll = withAuth(
  allowRoles(
    "admin",
    "hr",
    "super_admin"
  ),
  companyDomains,
  authorize("manage_payroll")
);

export const viewReports = withAuth(
  allowRoles(
    "admin",
    "hr",
    "teacher",
    "super_admin"
  ),
  authorize("view_reports")
);