import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/store'
import { setAuth } from '@/lib/store/authSlice'
import api from '@/lib/api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const user = useAppSelector((s) => s.auth.user)

  // Back to the page that sent the visitor here; same-site dashboard paths only.
  const from = (useLocation().state as { from?: string } | null)?.from
  const returnTo = from?.startsWith('/dashboard') && !from.startsWith('//') ? from : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 2 (two-factor sign-in): the server's challenge and the typed code.
  const [challenge, setChallenge] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)

  // Redirect already logged-in users
  if (user) {
    return <Navigate to={returnTo} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      const res = challenge
        ? await api.post('/auth/login/2fa', {
            challengeToken: challenge,
            ...(useRecovery ? { recoveryCode: code.trim() } : { code: code.replace(/\s/g, '') }),
          })
        : await api.post('/auth/login', {
            email,
            password,
          })

      // Password accepted, but two-factor sign-in is on: ask for the code.
      if (res.data.data?.twoFactorRequired) {
        setChallenge(res.data.data.challengeToken)
        setCode('')
        return
      }

      const { user, accessToken } = res.data.data

      // Access token goes to Redux memory; refresh token is an httpOnly cookie
      dispatch(setAuth({ user, token: accessToken }))

      navigate(returnTo)
    } catch (err) {
      // An expired challenge means starting over with the password.
      if ((err as { response?: { data?: { code?: string } } })?.response?.data?.code === 'TWO_FACTOR_CHALLENGE_INVALID') {
        setChallenge(null)
      }
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed',
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

        {challenge ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-900">Two-factor sign-in</p>
              <p className="mb-4 text-sm text-gray-500">
                {useRecovery
                  ? 'Enter one of the recovery codes you saved when you turned this on. Each code works once.'
                  : 'Open your authenticator app and enter the 6-digit code for PAISA.'}
              </p>
              <input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode={useRecovery ? 'text' : 'numeric'}
                autoComplete="one-time-code"
                maxLength={useRecovery ? 20 : 7}
                placeholder={useRecovery ? 'XXXX-XXXX' : '123 456'}
                aria-label={useRecovery ? 'Recovery code' : 'Authentication code'}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition focus:border-black"
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
              {loading ? 'Checking...' : 'Verify'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setUseRecovery(!useRecovery); setCode(''); setError('') }}
                className="text-gray-500 underline hover:text-black"
              >
                {useRecovery ? 'Use authenticator code' : 'Use a recovery code'}
              </button>
              <button
                type="button"
                onClick={() => { setChallenge(null); setCode(''); setError(''); setUseRecovery(false) }}
                className="text-gray-500 underline hover:text-black"
              >
                Back
              </button>
            </div>
            <p className="text-xs text-gray-400">Lost your phone and your codes? Ask your administrator to reset two-factor sign-in.</p>
          </form>
        ) : (
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
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 underline hover:text-black"
              >
                Forgot password?
              </Link>
            </div>

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
        )}
      </div>
    </div>
  )
}