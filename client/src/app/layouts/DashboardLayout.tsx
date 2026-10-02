import {
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import NotificationBell from '@/components/notifications/NotificationBell'

import api from '@/lib/api/axios'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import { navForRole, ROLE_LABEL, type Role } from '@/config/roles'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  if (!user) return null

  const sections = navForRole(user.role)

  const currentLabel = sections
    .flatMap((s) => s.items)
    .find(
      (i) =>
        location.pathname === i.path ||
        (i.path !== '/dashboard' &&
          location.pathname.startsWith(i.path + '/'))
    )?.label

  const roleLabel = ROLE_LABEL[user.role as Role] ?? user.role

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Still logout locally if API is unavailable.
    }

    dispatch(logout())
    navigate('/login')
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-gray-950">
      {/* ================================================================ */}
      {/* MOBILE OVERLAY                                                   */}
      {/* ================================================================ */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ================================================================ */}
      {/* SIDEBAR                                                          */}
      {/* ================================================================ */}

      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[78px]' : 'w-[246px]',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* -------------------------------------------------------------- */}
        {/* BRAND                                                          */}
        {/* -------------------------------------------------------------- */}

        <div
          className={[
            'flex h-[66px] shrink-0 items-center border-b border-gray-100',
            collapsed
              ? 'justify-center px-3'
              : 'justify-between px-4',
          ].join(' ')}
        >
          {!collapsed ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-950 text-xs font-black text-white">
                P
              </div>

              <div>
                <div className="text-[17px] font-black tracking-[-0.04em] text-gray-950">
                  PAISA
                </div>

                <div className="text-[10px] font-medium text-gray-400">
                  {roleLabel}
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-950 text-xs font-black text-white"
            >
              P
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={[
              'rounded-lg p-2 text-gray-400 transition',
              'hover:bg-gray-100 hover:text-gray-900',
              collapsed ? 'hidden lg:block' : '',
            ].join(' ')}
            aria-label={
              collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            <Menu
              size={17}
              className={[
                'transition-transform duration-300',
                collapsed ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* USER / WORKSPACE CARD                                          */}
        {/* -------------------------------------------------------------- */}

        {!collapsed && (
          <div className="border-b border-gray-100 p-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[11px] font-bold text-white">
                  {getInitials(user.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-900">
                    {user.name}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-gray-500">
                    {roleLabel}
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className="shrink-0 text-gray-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* NAVIGATION                                                      */}
        {/* -------------------------------------------------------------- */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4 sidebar-scroll">
          {sections.map((section) => (
            <div
              key={section.heading}
              className="mb-5"
            >
              {!collapsed && (
                <div className="mb-2 flex items-center gap-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  <span>{section.heading}</span>
                  <ChevronDown size={9} />
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  const active =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' &&
                      location.pathname.startsWith(
                        item.path + '/'
                      ))

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        'group relative flex items-center rounded-xl',
                        'transition-all duration-150',
                        collapsed
                          ? 'justify-center px-2 py-2.5'
                          : 'gap-3 px-3 py-2.5',
                        active
                          ? 'bg-gray-950 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
                      ].join(' ')}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={[
                          'shrink-0 transition-transform duration-150',
                          active
                            ? 'text-white'
                            : 'text-gray-500 group-hover:text-gray-900',
                        ].join(' ')}
                      />

                      {!collapsed && (
                        <span className="truncate text-[13px] font-medium">
                          {item.label}
                        </span>
                      )}

                      {!collapsed && active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* -------------------------------------------------------------- */}
        {/* LOGOUT                                                          */}
        {/* -------------------------------------------------------------- */}

        <div className="shrink-0 border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={[
              'flex w-full items-center rounded-xl',
              'text-[13px] font-medium text-gray-600',
              'transition-all duration-150',
              collapsed
                ? 'justify-center px-2 py-2.5'
                : 'gap-3 px-3 py-2.5',
              'hover:bg-red-50 hover:text-red-600',
            ].join(' ')}
          >
            <LogOut
              size={17}
              className="shrink-0"
            />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* MAIN CONTENT                                                     */}
      {/* ================================================================ */}

      <div
        className={[
          'min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-[78px]' : 'lg:pl-[246px]',
        ].join(' ')}
      >
        {/* -------------------------------------------------------------- */}
        {/* TOPBAR                                                          */}
        {/* -------------------------------------------------------------- */}

        <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-gray-950">
                {currentLabel ?? 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2.5">
            <NotificationBell />

            <div className="mx-1 hidden h-7 w-px bg-gray-200 sm:block" />

            <div className="hidden text-right sm:block">
              <p className="max-w-[150px] truncate text-xs font-semibold text-gray-900">
                {user.name}
              </p>

              <p className="text-[10px] text-gray-500">
                {roleLabel}
              </p>
            </div>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-950 text-[11px] font-bold text-white"
            >
              {getInitials(user.name)}
            </button>

            <button
              type="button"
              className="hidden rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 sm:block"
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        </header>

        {/* -------------------------------------------------------------- */}
        {/* PAGE                                                             */}
        {/* -------------------------------------------------------------- */}

        <main className="min-h-[calc(100vh-66px)] p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}