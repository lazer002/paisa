import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAppSelector } from '@/app/store'
import { allowedPathsForRole } from '@/config/roles'

/**
 * Route-level RBAC. Wraps protected routes; checks the logged-in user's role
 * against the central role config. UI hiding is cosmetic — this plus the
 * server-side checks are the actual enforcement layers.
 */
export default function RoleGuard() {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  const allowed = allowedPathsForRole(user.role)

  // exact match OR prefix match (e.g. /dashboard/classes/:id)
  const isAllowed =
    allowed.has(location.pathname) ||
    [...allowed].some((p) => p !== '/dashboard' && location.pathname.startsWith(p + '/'))

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 text-center shadow-sm">
        <ShieldAlert size={48} className="mb-4 text-gray-200" />
        <h2 className="text-lg font-semibold text-gray-700">Access restricted</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-400">
          Your role (<strong className="capitalize">{user.role.replace('_', ' ')}</strong>) does not
          have permission to view this page.
        </p>
      </div>
    )
  }

  return <Outlet />
}
