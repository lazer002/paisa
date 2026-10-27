import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

import NotificationBell from '@/components/notifications/NotificationBell'

import api from '@/lib/api/axios'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { logout } from '@/lib/store/authSlice'
import { navForRole, ROLE_LABEL, type Role } from '@/config/roles'

const getInitials = (name?: string) => {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const isActivePath = (pathname: string, path: string) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path + '/'))

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const sections = useMemo(() => (user ? navForRole(user.role) : []), [user])

  // Settings is pinned to the bottom of the sidebar, so drop it from the list
  const navSections = useMemo(
    () =>
      sections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.path !== '/dashboard/settings') }))
        .filter((s) => s.items.length > 0),
    [sections],
  )

  // Unique nav destinations for the "jump to page" search
  const destinations = useMemo(() => {
    const seen = new Set<string>()
    return sections
      .flatMap((s) => s.items.map((i) => ({ ...i, heading: s.heading })))
      .filter((i) => (seen.has(i.path) ? false : (seen.add(i.path), true)))
  }, [sections])

  const matches = query.trim()
    ? destinations.filter((d) => d.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (!user) return null

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

  const goTo = (path: string) => {
    setQuery('')
    setSearchOpen(false)
    setMobileOpen(false)
    navigate(path)
  }

  const sidebarWidth = collapsed ? 'lg:w-[60px]' : 'lg:w-[240px]'

  return (
    <div className="min-h-screen bg-bg text-gray-900">
      {/* ── TOP BAR (Polaris dark) ─────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 bg-topbar px-3 lg:px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-[#e3e3e3] transition hover:bg-white/10 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <Link to="/dashboard" className="flex shrink-0 items-center gap-2 lg:w-[224px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#36fba1] text-xs font-black text-[#1a1a1a]">
            P
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-white sm:inline">PAISA</span>
        </Link>

        {/* Jump-to-page search */}
        <div ref={searchRef} className="relative mx-auto w-full max-w-[480px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#b5b5b5]" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) goTo(matches[0].path)
              if (e.key === 'Escape') { setQuery(''); setSearchOpen(false) }
            }}
            placeholder="Search pages"
            aria-label="Search pages"
            className="h-8 w-full rounded-lg border border-[#4a4a4a] bg-[#303030] pl-9 pr-3 text-sm text-white placeholder:text-[#b5b5b5] transition hover:border-[#616161] focus:bg-[#3a3a3a]"
          />
          {searchOpen && matches.length > 0 && (
            <div className="p-card absolute inset-x-0 top-10 z-50 overflow-hidden py-1.5 shadow-xl">
              {matches.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.path}
                    type="button"
                    onClick={() => goTo(m.path)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                  >
                    <Icon size={16} className="text-gray-500" />
                    <span className="font-medium">{m.label}</span>
                    <span className="ml-auto text-xs text-gray-400">{m.heading}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <NotificationBell />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c4fde1] text-[11px] font-bold text-[#0c5132]">
                {getInitials(user.name)}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-[#e3e3e3] sm:block">
                {user.name}
              </span>
            </button>

            {menuOpen && (
              <div role="menu" className="p-card absolute right-0 top-11 z-50 w-60 overflow-hidden py-1.5 shadow-xl">
                <div className="px-3 pb-2 pt-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                  <span className="mt-1.5 inline-flex rounded-lg bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {roleLabel}
                  </span>
                </div>
                <div className="my-1 border-t border-gray-200" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate('/dashboard/settings') }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                >
                  <Settings size={16} className="text-gray-500" /> Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#8e0b21] hover:bg-[#fedad9]/60"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE OVERLAY ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* ── SIDEBAR (Polaris navigation) ───────────────────────────────── */}
      <aside
        className={[
          'fixed bottom-0 left-0 top-14 z-40 flex w-[240px] flex-col bg-nav transition-[width,transform] duration-200',
          sidebarWidth,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {navSections.map((section) => (
            <div key={section.heading} className="mb-3">
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium text-gray-500">{section.heading}</p>
              )}
              <div className="space-y-px">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActivePath(location.pathname, item.path)
                  return (
                    <Link
                      key={`${section.heading}-${item.path}`}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'group flex items-center rounded-lg text-sm transition-colors',
                        collapsed ? 'justify-center px-2 py-1.5' : 'gap-2 px-2 py-1.5',
                        active
                          ? 'bg-white font-semibold text-gray-900 shadow-sm'
                          : 'font-medium text-gray-700 hover:bg-black/[0.05] hover:text-gray-900',
                      ].join(' ')}
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.9}
                        className={active ? 'shrink-0 text-gray-900' : 'shrink-0 text-gray-500 group-hover:text-gray-900'}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-px border-t border-black/[0.06] px-2 py-2">
          <Link
            to="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? 'Settings' : undefined}
            className={[
              'flex items-center rounded-lg text-sm transition-colors',
              collapsed ? 'justify-center px-2 py-1.5' : 'gap-2 px-2 py-1.5',
              isActivePath(location.pathname, '/dashboard/settings')
                ? 'bg-white font-semibold text-gray-900 shadow-sm'
                : 'font-medium text-gray-700 hover:bg-black/[0.05]',
            ].join(' ')}
          >
            <Settings size={18} className="shrink-0 text-gray-500" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={[
              'hidden w-full items-center rounded-lg text-sm font-medium text-gray-500 transition-colors hover:bg-black/[0.05] hover:text-gray-900 lg:flex',
              collapsed ? 'justify-center px-2 py-1.5' : 'gap-2 px-2 py-1.5',
            ].join(' ')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── PAGE ───────────────────────────────────────────────────────── */}
      <div className={['pt-14 transition-[padding] duration-200', collapsed ? 'lg:pl-[60px]' : 'lg:pl-[240px]'].join(' ')}>
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[1320px] px-4 py-5 sm:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
