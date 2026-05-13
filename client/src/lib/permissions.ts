export type Role = "super_admin" | "admin" | "teacher" | "student" | "hr" | "employee";

interface RoleCapability {
  // User management
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeactivateUsers: boolean;
  canCreateAdmins: boolean;
  // Content management
  canCreateAnnouncements: boolean;
  canDeleteAnnouncements: boolean;
  canManageMaterials: boolean;
  // Classes
  canCreateClasses: boolean;
  canEditClasses: boolean;
  canDeleteClasses: boolean;
  canEnrollStudents: boolean;
  // Assignments
  canCreateAssignments: boolean;
  canGradeAssignments: boolean;
  canDeleteAssignments: boolean;
  // Attendance
  canMarkAttendance: boolean;
  canViewAllAttendance: boolean;
  // Leave
  canApplyLeave: boolean;
  canApproveLeave: boolean;
  // Payroll
  canProcessPayroll: boolean;
  canViewAllPayroll: boolean;
  // Departments
  canManageDepartments: boolean;
  // Org
  canManageOrganizations: boolean;
  canViewBilling: boolean;
  // General
  canViewReports: boolean;
}

const permissions: Record<Role, RoleCapability> = {
  super_admin: {
    canCreateUsers: true, canEditUsers: true, canDeactivateUsers: true, canCreateAdmins: true,
    canCreateAnnouncements: true, canDeleteAnnouncements: true, canManageMaterials: true,
    canCreateClasses: true, canEditClasses: true, canDeleteClasses: true, canEnrollStudents: true,
    canCreateAssignments: true, canGradeAssignments: true, canDeleteAssignments: true,
    canMarkAttendance: true, canViewAllAttendance: true,
    canApplyLeave: false, canApproveLeave: true,
    canProcessPayroll: true, canViewAllPayroll: true,
    canManageDepartments: true, canManageOrganizations: true, canViewBilling: true,
    canViewReports: true,
  },
  admin: {
    canCreateUsers: true, canEditUsers: true, canDeactivateUsers: true, canCreateAdmins: false,
    canCreateAnnouncements: true, canDeleteAnnouncements: true, canManageMaterials: true,
    canCreateClasses: true, canEditClasses: true, canDeleteClasses: true, canEnrollStudents: true,
    canCreateAssignments: true, canGradeAssignments: true, canDeleteAssignments: true,
    canMarkAttendance: true, canViewAllAttendance: true,
    canApplyLeave: false, canApproveLeave: true,
    canProcessPayroll: true, canViewAllPayroll: true,
    canManageDepartments: true, canManageOrganizations: false, canViewBilling: true,
    canViewReports: true,
  },
  teacher: {
    canCreateUsers: false, canEditUsers: false, canDeactivateUsers: false, canCreateAdmins: false,
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canManageMaterials: true,
    canCreateClasses: false, canEditClasses: true, canDeleteClasses: false, canEnrollStudents: false,
    canCreateAssignments: true, canGradeAssignments: true, canDeleteAssignments: true,
    canMarkAttendance: true, canViewAllAttendance: false,
    canApplyLeave: true, canApproveLeave: false,
    canProcessPayroll: false, canViewAllPayroll: false,
    canManageDepartments: false, canManageOrganizations: false, canViewBilling: false,
    canViewReports: false,
  },
  student: {
    canCreateUsers: false, canEditUsers: false, canDeactivateUsers: false, canCreateAdmins: false,
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canManageMaterials: false,
    canCreateClasses: false, canEditClasses: false, canDeleteClasses: false, canEnrollStudents: false,
    canCreateAssignments: false, canGradeAssignments: false, canDeleteAssignments: false,
    canMarkAttendance: false, canViewAllAttendance: false,
    canApplyLeave: false, canApproveLeave: false,
    canProcessPayroll: false, canViewAllPayroll: false,
    canManageDepartments: false, canManageOrganizations: false, canViewBilling: false,
    canViewReports: false,
  },
  hr: {
    canCreateUsers: false, canEditUsers: false, canDeactivateUsers: false, canCreateAdmins: false,
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canManageMaterials: false,
    canCreateClasses: false, canEditClasses: false, canDeleteClasses: false, canEnrollStudents: false,
    canCreateAssignments: false, canGradeAssignments: false, canDeleteAssignments: false,
    canMarkAttendance: false, canViewAllAttendance: false,
    canApplyLeave: false, canApproveLeave: true,
    canProcessPayroll: true, canViewAllPayroll: true,
    canManageDepartments: true, canManageOrganizations: false, canViewBilling: false,
    canViewReports: true,
  },
  employee: {
    canCreateUsers: false, canEditUsers: false, canDeactivateUsers: false, canCreateAdmins: false,
    canCreateAnnouncements: false, canDeleteAnnouncements: false, canManageMaterials: false,
    canCreateClasses: false, canEditClasses: false, canDeleteClasses: false, canEnrollStudents: false,
    canCreateAssignments: false, canGradeAssignments: false, canDeleteAssignments: false,
    canMarkAttendance: false, canViewAllAttendance: false,
    canApplyLeave: true, canApproveLeave: false,
    canProcessPayroll: false, canViewAllPayroll: false,
    canManageDepartments: false, canManageOrganizations: false, canViewBilling: false,
    canViewReports: false,
  },
};

export function usePermissions(role: Role | undefined): RoleCapability {
  if (!role) return permissions.student;
  return permissions[role] || permissions.student;
}

export function can(role: Role | undefined, action: keyof RoleCapability): boolean {
  if (!role) return false;
  return permissions[role]?.[action] ?? false;
}
