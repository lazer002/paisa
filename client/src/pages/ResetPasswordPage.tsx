import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { useAppDispatch } from '@/app/store'
import api from '@/lib/api/axios'
import { logout } from '@/lib/store/authSlice'

const RULES: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

type ApiErr = {
  response?: { data?: { message?: string; errors?: Array<{ message?: string }> } }
}

/** Public: POST /auth/reset-password with the ?token= from the emailed link. */
export default function ResetPasswordPage() {
  const dispatch = useAppDispatch()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const rulesOk = RULES.every((r) => r.test(password))
  const matches = password.length > 0 && password === confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rulesOk || !matches) return

    try {
      setLoading(true)
      setError('')
      await api.post('/auth/reset-password', { token, password, confirmPassword: confirm })
      // Every session was revoked server-side; drop any local one too.
      dispatch(logout())
      setDone(true)
    } catch (err) {
      const data = (err as ApiErr)?.response?.data
      setError(data?.errors?.[0]?.message || data?.message || 'Could not reset the password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">PAISA</h1>
          <p className="mt-2 text-sm text-gray-500">Choose a new password</p>
        </div>

        {!token ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-600">
              This reset link is missing its token. Open the link from your email again, or request a new one.
            </div>
            <Link
              to="/forgot-password"
              className="block w-full rounded-xl bg-black py-3 text-center font-medium text-white hover:opacity-90"
            >
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              Your password has been reset. You have been signed out everywhere.
            </div>
            <Link
              to="/login"
              className="block w-full rounded-xl bg-black py-3 text-center font-medium text-white hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              />
              <ul className="mt-2 space-y-0.5 text-xs">
                {RULES.map((r) => (
                  <li key={r.label} className={r.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    {r.test(password) ? '✓' : '•'} {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              />
              {confirm && !matches && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-600">
                {error}{' '}
                <Link to="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !rulesOk || !matches}
              className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Reset password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-gray-600 underline hover:text-black">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
