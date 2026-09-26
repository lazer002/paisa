import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/store'
import { setAuth } from '@/lib/store/authSlice'
import api from '@/lib/api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const user = useAppSelector((s) => s.auth.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect already logged-in users
  if (user) {
    return <Navigate to="/dashboard" replace />
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

      const { user, accessToken } = res.data.data

      // Access token goes to Redux memory; refresh token is an httpOnly cookie
      dispatch(setAuth({ user, token: accessToken }))

      navigate('/dashboard')
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