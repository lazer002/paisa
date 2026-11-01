import { useState } from 'react'
import { Link } from 'react-router-dom'

import api from '@/lib/api/axios'

/** Public: POST /auth/forgot-password. The answer never says whether the email exists. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')
      const res = await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(
        res.data?.message ||
          'If an account exists for that email, a password reset link has been sent.',
      )
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not send the reset link. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">PAISA</h1>
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{sent}</div>
            <p className="text-sm text-gray-500">
              The link expires soon and works once. Check your spam folder if it does not arrive.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="Enter your account email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
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
