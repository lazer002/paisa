import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

import { useAppSelector } from '@/app/store'
import { allowedPathsForRole } from '@/config/roles'

export default function RoleGuard() {
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)

  const location = useLocation()

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  const allowed = allowedPathsForRole(user.role)

  const isAllowed =
    allowed.has(location.pathname) ||
    [...allowed].some(
      (path) =>
        path !== '/dashboard' &&
        location.pathname.startsWith(path + '/')
    )

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl bg-white px-6 text-center shadow-sm">
        <ShieldAlert
          size={48}
          className="mb-4 text-gray-200"
        />

        <h2 className="text-lg font-semibold text-gray-700">
          Access restricted
        </h2>

        <p className="mt-1 max-w-sm text-sm text-gray-400">
          Your role (
          <strong className="capitalize">
            {user.role.replace('_', ' ')}
          </strong>
          ) does not have permission to view this page.
        </p>
      </div>
    )
  }

  return <Outlet />
}