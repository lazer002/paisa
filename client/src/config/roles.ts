import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  ClipboardList,
  Settings,
  Megaphone,
  Briefcase,
  UserCog,
  Wallet,
  FileText,
  School,
  CalendarCheck,
  Building,
  ShieldCheck,
  CreditCard,
  BarChart3,
  BookOpen,
  Library,
  Network,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'super_admin' | 'admin' | 'teacher' | 'student' | 'hr' | 'employee'

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  /** Roles allowed to SEE this nav item. undefined = all roles with access to the section */
  roles?: Role[]
}

export interface NavSection {
  heading: string
  items: NavItem[]
}

/**
 * Single source of truth for role-based navigation.
 * The RoleGuard uses the same paths to authorize route access.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }],
  },
  {
    heading: 'Platform',
    items: [
      { label: 'Organizations', icon: Building2, path: '/dashboard/organizations', roles: ['super_admin', 'admin'] },
      { label: 'Companies', icon: Building, path: '/dashboard/companies', roles: ['super_admin'] },
      { label: 'Institutes', icon: School, path: '/dashboard/institutes', roles: ['super_admin'] },
      { label: 'Users', icon: Users, path: '/dashboard/users', roles: ['super_admin', 'admin'] },
      { label: 'HR Panel', icon: UserCog, path: '/dashboard/hr', roles: ['super_admin', 'admin'] },
      { label: 'Billing', icon: CreditCard, path: '/dashboard/billing', roles: ['super_admin'] },
      { label: 'Reports', icon: BarChart3, path: '/dashboard/reports', roles: ['super_admin', 'admin', 'hr'] },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Students', icon: GraduationCap, path: '/dashboard/students', roles: ['super_admin', 'admin', 'teacher'] },
      { label: 'Employees', icon: Briefcase, path: '/dashboard/employees', roles: ['super_admin', 'admin', 'hr'] },
    ],
  },
  {
    heading: 'Learning',
    items: [
      { label: 'Classes', icon: ClipboardList, path: '/dashboard/classes', roles: ['super_admin', 'admin', 'teacher', 'student'] },
      { label: 'Assignments', icon: BookOpen, path: '/dashboard/assignments', roles: ['super_admin', 'admin', 'teacher', 'student'] },
      { label: 'Study Materials', icon: Library, path: '/dashboard/materials', roles: ['super_admin', 'admin', 'teacher', 'student'] },
      { label: 'Attendance', icon: CalendarCheck, path: '/dashboard/attendance', roles: ['super_admin', 'admin', 'teacher', 'student', 'hr', 'employee'] },
    ],
  },
  {
    heading: 'Work',
    items: [
      { label: 'Announcements', icon: Megaphone, path: '/dashboard/announcements' },
      { label: 'Leaves', icon: FileText, path: '/dashboard/leaves' },
      { label: 'Payroll', icon: Wallet, path: '/dashboard/payroll', roles: ['super_admin', 'admin', 'hr', 'employee'] },
      { label: 'Departments', icon: Network, path: '/dashboard/departments', roles: ['super_admin', 'admin', 'hr'] },
    ],
  },
  {
    heading: 'System',
    items: [{ label: 'Settings', icon: Settings, path: '/dashboard/settings' }],
  },
]

/** Flat list of route paths a role may access (all paths are under /dashboard) */
export function allowedPathsForRole(role: string): Set<string> {
  const allowed = new Set<string>(['/dashboard'])
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (!item.roles || item.roles.includes(role as Role)) {
        allowed.add(item.path)
      }
    }
  }
  return allowed
}

export function navForRole(role: string): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role as Role)),
  })).filter((section) => section.items.length > 0)
}

export const ALL_ROLES: Role[] = ['super_admin', 'admin', 'teacher', 'student', 'hr', 'employee']

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  hr: 'HR Manager',
  employee: 'Employee',
}

export { ShieldCheck }
