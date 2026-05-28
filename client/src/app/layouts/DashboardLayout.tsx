import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  Megaphone,
  Briefcase,
  UserCog,
  Wallet,
  FileText,
  School,
} from 'lucide-react'

import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useState } from 'react'

import { useAuthStore } from '@/lib/store/authStore'

const sidebarConfig = {
  super_admin: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    { label: "Organizations", path: "/dashboard/organizations", icon: Building2 },

    {
      label: 'Companies',
      icon: Building2,
      path: '/dashboard/companies',
    },
    {
      label: 'Users',
      icon: Users,
      path: '/dashboard/users',
    },
    {
      label: 'Students',
      icon: GraduationCap,
      path: '/dashboard/students',
    },
    {
      label: 'Classes',
      icon: ClipboardList,
      path: '/dashboard/classes',
    },
    { label: "Attendance", path: "/dashboard/attendance", icon: ClipboardList },
    { label: "Announcements", path: "/dashboard/announcements", icon: Megaphone },
    { label: "Employees", path: "/dashboard/employees", icon: Briefcase },
    { label: "HR Panel", path: "/dashboard/hr", icon: UserCog },
    { label: "Payroll", path: "/dashboard/payroll", icon: Wallet },
    { label: "Billing", path: "/dashboard/billing", icon: FileText },
    { label: "Reports", path: "/dashboard/reports", icon: FileText },
    { label: "Institutes", path: "/dashboard/institutes", icon: School },
    {
      label: 'Settings',
      icon: Settings,
      path: '/dashboard/settings',
    },
  ],
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] =
    useState(false)

  const [collapsed, setCollapsed] =
    useState(false)

  const user = useAuthStore((s) => s.user)

  const logout = useAuthStore((s) => s.logout)

  if (!user) return null

  const sidebarItems =
    sidebarConfig[
      user.role as keyof typeof sidebarConfig
    ] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen flex-col
          border-r border-white/10
          bg-gradient-to-b from-gray-950 via-gray-900 to-black
          text-white shadow-2xl
          transition-all duration-300 ease-in-out

          ${
            collapsed ? 'w-20' : 'w-72'
          }

          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {/* Header */}
        <div
          className={`
            flex h-16 items-center border-b border-white/10 px-4
            ${
              collapsed
                ? 'justify-center'
                : 'justify-between'
            }
          `}
        >
          {!collapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h1 className="text-xl font-bold tracking-wide">
                PAISA
              </h1>

              <p className="truncate text-xs text-gray-400">
                {user.name}
              </p>
            </div>
          )}

          <button
            onClick={() =>
              setCollapsed(!collapsed)
            }
            className="
              rounded-xl p-2 text-gray-400
              transition-all duration-300
              hover:bg-white/10
              hover:text-white
            "
          >
            <Menu
              className={`
                h-5 w-5 transition-transform duration-300
                ${
                  collapsed
                    ? 'rotate-180'
                    : 'rotate-0'
                }
              `}
            />
          </button>
        </div>

        {/* User card */}
        {!collapsed && (
          <div className="p-4">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-gray-300">
                Logged in as
              </p>

              <h2 className="mt-1 font-semibold">
                {user.name}
              </h2>

              <p className="text-sm text-gray-400">
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon

              const active =
                location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={`
                    group relative flex items-center
                    gap-3 overflow-hidden rounded-2xl
                    px-4 py-3 text-sm font-medium
                    transition-all duration-300

                    hover:scale-[1.02]
                    active:scale-[0.98]

                    ${
                      active
                        ? 'bg-white text-black shadow-lg'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className="
                      flex-shrink-0 transition-transform
                      duration-300 group-hover:scale-110
                    "
                  />

                  <span
                    className={`
                      whitespace-nowrap transition-all duration-300
                      ${
                        collapsed
                          ? 'w-0 opacity-0'
                          : 'w-auto opacity-100'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className={`
              flex w-full items-center gap-3
              rounded-2xl bg-red-500/10 px-4 py-3
              text-sm font-medium text-red-400

              transition-all duration-300

              hover:bg-red-500
              hover:text-white
              hover:scale-[1.02]

              ${
                collapsed
                  ? 'justify-center'
                  : ''
              }
            `}
          >
            <LogOut
              size={20}
              className="flex-shrink-0"
            />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`
          flex min-h-screen flex-1 flex-col
          transition-all duration-300
          ${
            collapsed
              ? 'lg:ml-20'
              : 'lg:ml-72'
          }
        `}
      >
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <button
            onClick={() =>
              setMobileOpen(true)
            }
            className="rounded-lg p-2 transition hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-lg font-semibold">
              {sidebarItems.find((i) => i.path === location.pathname)?.label ?? 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-gray-500">
                {user.role}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-semibold text-white">
              {user.name?.[0]}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}