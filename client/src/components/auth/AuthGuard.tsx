import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/store'

export default function AuthGuard() {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()
  // Remember where the visitor was going (e.g. a scanned attendance QR link).
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  return <Outlet />
}
