import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { BadgeCheck, ShieldX, Clock, Search } from 'lucide-react'

import { useVerifyCertificateQuery } from '@/features/platform/platformApi'
import Button from '@/components/ui/button'

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

const STATUS_UI = {
  valid: { label: 'Valid certificate', icon: BadgeCheck, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  revoked: { label: 'This certificate has been revoked', icon: ShieldX, cls: 'border-rose-200 bg-rose-50 text-rose-800' },
  expired: { label: 'This certificate has expired', icon: Clock, cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  invalid: { label: 'This certificate is not valid', icon: ShieldX, cls: 'border-rose-200 bg-rose-50 text-rose-800' },
} as const

/** Public page (no login): /verify and /verify/:code. */
export default function VerifyCertificatePage() {
  const { code: routeCode } = useParams<{ code?: string }>()
  // Remount per code so the input resets to the code in the URL.
  return <VerifyCertificate key={routeCode ?? ''} routeCode={routeCode} />
}

function VerifyCertificate({ routeCode }: { routeCode?: string }) {
  const navigate = useNavigate()
  const [input, setInput] = useState(routeCode ?? '')

  const code = (routeCode ?? '').trim()
  const { data, error, isFetching } = useVerifyCertificateQuery(code, { skip: !code })
  const status = (error as { status?: number } | undefined)?.status

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = input.trim().toUpperCase().replace(/\s+/g, '')
    if (next) navigate(`/verify/${encodeURIComponent(next)}`)
  }

  const ui = data ? STATUS_UI[data.status] ?? STATUS_UI.invalid : null

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Verify a certificate</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the verification code printed on the certificate.</p>
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input
            className="p-input flex-1 font-mono uppercase"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 7F3A-91C2-0B5D-E8A4"
            aria-label="Verification code"
            autoFocus={!routeCode}
          />
          <Button type="submit" disabled={!input.trim()}>
            <Search size={14} /> Verify
          </Button>
        </form>

        {code && isFetching && <p className="text-center text-sm text-gray-400">Checking…</p>}

        {code && !isFetching && error && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
            {status === 404
              ? 'No certificate matches this code. Check the code and try again.'
              : status === 429
                ? 'Too many attempts. Please wait a minute and try again.'
                : 'Could not verify right now. Please try again later.'}
          </div>
        )}

        {data && ui && !isFetching && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className={`flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold ${ui.cls}`}>
              <ui.icon size={18} /> {ui.label}
            </div>
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 px-5 py-4 text-sm">
              <dt className="text-gray-500">Awarded to</dt>
              <dd className="col-span-2 font-medium text-gray-900">{data.holderName ?? '—'}</dd>
              <dt className="text-gray-500">Certificate</dt>
              <dd className="col-span-2 text-gray-900">{data.title}</dd>
              <dt className="text-gray-500">Issued by</dt>
              <dd className="col-span-2 text-gray-900">{data.organizationName ?? '—'}</dd>
              <dt className="text-gray-500">Issue date</dt>
              <dd className="col-span-2 text-gray-900">{fmtDate(data.issueDate)}</dd>
              {data.validUntil && (
                <>
                  <dt className="text-gray-500">Valid until</dt>
                  <dd className="col-span-2 text-gray-900">{fmtDate(data.validUntil)}</dd>
                </>
              )}
              {data.revokedAt && (
                <>
                  <dt className="text-gray-500">Revoked on</dt>
                  <dd className="col-span-2 text-gray-900">{fmtDate(data.revokedAt)}</dd>
                </>
              )}
              {data.certificateNumber && (
                <>
                  <dt className="text-gray-500">Number</dt>
                  <dd className="col-span-2 font-mono text-gray-900">{data.certificateNumber}</dd>
                </>
              )}
              <dt className="text-gray-500">Code</dt>
              <dd className="col-span-2 font-mono text-gray-900">{data.code}</dd>
            </dl>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          <Link to="/login" className="hover:text-gray-600">Sign in to PAISA</Link>
        </p>
      </div>
    </div>
  )
}
