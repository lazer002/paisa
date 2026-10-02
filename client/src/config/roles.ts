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
  BarChart3,
  BookOpen,
  Library,
  Network,
  FileQuestion,
  UserPlus,
  Headphones,
  Trophy,
  CalendarDays,
  Receipt,
  MessageSquare,
  Video,
  type LucideIcon,
} from 'lucide-react'

export type Role =
  | 'super_admin'
  | 'admin'
  | 'principal'
  | 'teacher'
  | 'student'
  | 'hr'
  | 'accountant'
  | 'counselor'
  | 'support'
  | 'employee'
  | 'parent'

export interface NavItem {
  label: string
  icon: LucideIcon
  path: string
  roles?: Role[]
}

export interface NavSection {
  heading: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  // =========================================================
  // OVERVIEW
  // =========================================================
  {
    heading: 'Overview',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
      },
    ],
  },

  // =========================================================
  // PLATFORM
  // SUPER ADMIN ONLY
  // =========================================================
  {
    heading: 'Platform',
    items: [
      {
        label: 'Organizations',
        icon: Building2,
        path: '/dashboard/organizations',
        roles: ['super_admin'],
      },
      {
        label: 'Companies',
        icon: Building,
        path: '/dashboard/companies',
        roles: ['super_admin'],
      },
      {
        label: 'Institutes',
        icon: School,
        path: '/dashboard/institutes',
        roles: ['super_admin'],
      },
      {
        label: 'Users',
        icon: Users,
        path: '/dashboard/users',
        roles: ['super_admin'],
      },
      {
        label: 'Reports',
        icon: BarChart3,
        path: '/dashboard/reports',
        roles: ['super_admin'],
      },
    ],
  },

// =========================================================
// ORGANIZATION
// ADMIN / PRINCIPAL / HR
// =========================================================
{
  heading: 'Organization',
  items: [
    {
      label: 'Organization',
      icon: Building2,
      path: '/dashboard/organizations',
      roles: ['admin', 'principal'],
    },
    {
      label: 'Users',
      icon: Users,
      path: '/dashboard/users',
      roles: ['admin', 'principal'],
    },
    {
      label: 'Departments',
      icon: Network,
      path: '/dashboard/departments',
      roles: ['admin', 'principal', 'hr'],
    },
    {
      label: 'HR Operations',
      icon: ShieldCheck,
      path: '/dashboard/hr-ops',
      roles: ['admin', 'principal', 'hr'],
    },
  ],
},
  // =========================================================
  // PEOPLE
  // =========================================================
  {
    heading: 'People',
    items: [
      {
        label: 'Students',
        icon: GraduationCap,
        path: '/dashboard/students',
        roles: [
          'admin',
          'principal',
          'teacher',
          'counselor',
        ],
      },
      {
        label: 'Employees',
        icon: Briefcase,
        path: '/dashboard/employees',
        roles: [
          'admin',
          'principal',
          'hr',
        ],
      },
      {
        label: 'Teachers',
        icon: UserCog,
        path: '/dashboard/teachers',
        roles: [
          'admin',
          'principal',
          'hr',
        ],
      },
    ],
  },

  // =========================================================
  // LEARNING / ACADEMICS
  // =========================================================
  {
    heading: 'Learning',
    items: [
      {
        label: 'Classes',
        icon: ClipboardList,
        path: '/dashboard/classes',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'parent',
        ],
      },
      {
        label: 'Enrollments',
        icon: UserPlus,
        path: '/dashboard/enrollments',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
        ],
      },
      {
        label: 'Assignments',
        icon: BookOpen,
        path: '/dashboard/assignments',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
        ],
      },
      {
        label: 'Tests',
        icon: FileQuestion,
        path: '/dashboard/tests',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
        ],
      },
      {
        label: 'Study Materials',
        icon: Library,
        path: '/dashboard/materials',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
        ],
      },
      {
        label: 'Live Sessions',
        icon: Video,
        path: '/dashboard/live-sessions',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'parent',
        ],
      },
      {
        label: 'Attendance',
        icon: CalendarCheck,
        path: '/dashboard/attendance',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'hr',
          'employee',
          'parent',
        ],
      },
    ],
  },

  // =========================================================
  // HR
  // =========================================================
  {
    heading: 'HR',
    items: [
      {
        label: 'HR Panel',
        icon: UserCog,
        path: '/dashboard/hr',
        roles: [
          'admin',
          'principal',
          'hr',
        ],
      },
      {
        label: 'Employees',
        icon: Briefcase,
        path: '/dashboard/employees',
        roles: [
          'admin',
          'principal',
          'hr',
        ],
      },
      {
        label: 'Departments',
        icon: Network,
        path: '/dashboard/departments',
        roles: [
          'admin',
          'principal',
          'hr',
        ],
      },
      {
        label: 'Leaves',
        icon: FileText,
        path: '/dashboard/leaves',
        roles: [
          'admin',
          'principal',
          'hr',
          'employee',
        ],
      },
      {
        label: 'Payroll',
        icon: Wallet,
        path: '/dashboard/payroll',
        roles: [
          'admin',
          'principal',
          'hr',
          'accountant',
          'employee',
        ],
      },
    ],
  },

  // =========================================================
  // COMMUNICATION
  // =========================================================
  {
    heading: 'Communication',
    items: [
      {
        label: 'Messages',
        icon: MessageSquare,
        path: '/dashboard/messages',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'hr',
          'accountant',
          'counselor',
          'support',
          'employee',
          'parent',
        ],
      },
      {
        label: 'Announcements',
        icon: Megaphone,
        path: '/dashboard/announcements',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'hr',
          'employee',
          'parent',
        ],
      },
      {
        label: 'Events',
        icon: CalendarDays,
        path: '/dashboard/events',
        roles: [
          'admin',
          'principal',
          'teacher',
          'student',
          'hr',
          'employee',
          'parent',
        ],
      },
    ],
  },

  // =========================================================
  // FINANCE
  // =========================================================
  {
    heading: 'Finance',
    items: [
      {
        label: 'Billing',
        icon: Receipt,
        path: '/dashboard/billing',
        roles: [
          'admin',
          'principal',
          'accountant',
        ],
      },
      {
        label: 'Payroll',
        icon: Wallet,
        path: '/dashboard/payroll',
        roles: [
          'admin',
          'principal',
          'hr',
          'accountant',
          'employee',
        ],
      },
    ],
  },

  // =========================================================
  // STUDENT / PARENT
  // =========================================================
  {
    heading: 'My Learning',
    items: [
      {
        label: 'My Classes',
        icon: School,
        path: '/dashboard/classes',
        roles: [
          'student',
          'parent',
        ],
      },
      {
        label: 'My Assignments',
        icon: BookOpen,
        path: '/dashboard/assignments',
        roles: [
          'student',
          'parent',
        ],
      },
      {
        label: 'My Tests',
        icon: FileQuestion,
        path: '/dashboard/tests',
        roles: [
          'student',
          'parent',
        ],
      },
      {
        label: 'My Attendance',
        icon: CalendarCheck,
        path: '/dashboard/attendance',
        roles: [
          'student',
          'parent',
        ],
      },
      {
        label: 'Live Sessions',
        icon: Video,
        path: '/dashboard/live-sessions',
        roles: [
          'student',
          'parent',
        ],
      },
    ],
  },

  // =========================================================
  // SERVICES
  // =========================================================
  {
    heading: 'Services',
    items: [
      {
        label: 'CRM',
        icon: BarChart3,
        path: '/dashboard/crm',
        roles: [
          'admin',
          'principal',
          'counselor',
        ],
      },
      {
        label: 'Support',
        icon: Headphones,
        path: '/dashboard/tickets',
        roles: [
          'super_admin',
          'admin',
          'principal',
          'teacher',
          'student',
          'hr',
          'accountant',
          'counselor',
          'support',
          'employee',
          'parent',
        ],
      },
      {
        label: 'Gamification',
        icon: Trophy,
        path: '/dashboard/gamification',
        roles: [
          'student',
          'teacher',
          'parent',
        ],
      },
    ],
  },

  // =========================================================
  // SYSTEM
  // =========================================================
  {
    heading: 'System',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        path: '/dashboard/settings',
      },
    ],
  },
]

/**
 * Returns all routes a role is allowed to access.
 */
export function allowedPathsForRole(role: string): Set<string> {
  const allowed = new Set<string>(['/dashboard'])

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (
        !item.roles ||
        item.roles.includes(role as Role)
      ) {
        allowed.add(item.path)
      }
    }
  }

  return allowed
}

/**
 * Returns only the navigation sections/items
 * visible to the current user's role.
 */
export function navForRole(role: string): NavSection[] {
  return NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !item.roles ||
          item.roles.includes(role as Role),
      ),
    }))
    .filter(
      (section) =>
        section.items.length > 0,
    )
}

/**
 * All supported roles.
 */
export const ALL_ROLES: Role[] = [
  'super_admin',
  'admin',
  'principal',
  'teacher',
  'student',
  'hr',
  'accountant',
  'counselor',
  'support',
  'employee',
  'parent',
]

/**
 * Human-readable role labels.
 */
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  hr: 'HR Manager',
  accountant: 'Accountant',
  counselor: 'Counselor',
  support: 'Support',
  employee: 'Employee',
  parent: 'Parent',
}

export { ShieldCheck }