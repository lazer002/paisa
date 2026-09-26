import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/store'

export default function AuthGuard() {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
