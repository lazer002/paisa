import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import api from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()

  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect already logged-in users
  if (user) {
    switch (user.role) {
      case 'super_admin':
        return <Navigate to="/dashboard" replace />

      case 'admin':
        return <Navigate to="/admin" replace />

      case 'teacher':
        return <Navigate to="/teacher" replace />

      case 'student':
        return <Navigate to="/student" replace />

      case 'hr':
        return <Navigate to="/hr" replace />

      case 'employee':
        return <Navigate to="/employee" replace />

      default:
        return <Navigate to="/" replace />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      const res = await api.post('/auth/login', {
        email,
        password,
      })

      const { user, token } = res.data.data

      // Save auth to Zustand persist
      setAuth(user, token)

      // Navigate by role
      switch (user.role) {
        case 'super_admin':
          navigate('/dashboard')
          break

        case 'admin':
          navigate('/admin')
          break

        case 'teacher':
          navigate('/teacher')
          break

        case 'student':
          navigate('/student')
          break

        case 'hr':
          navigate('/hr')
          break

        case 'employee':
          navigate('/employee')
          break

        default:
          navigate('/')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Login failed',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            PAISA
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Multi-Tenant ERP + HRMS + LMS
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}