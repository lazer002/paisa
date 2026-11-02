import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ShieldCheck, ShieldOff, Copy, KeyRound } from 'lucide-react'

import api from '@/lib/api/axios'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'

type Status = { enabled: boolean; enabledAt: string | null; recoveryCodesLeft: number }

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black'

const errorText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

/**
 * Two-factor sign-in for the signed-in user: set up with an authenticator
 * app (QR + typed secret), keep recovery codes, regenerate or turn off.
 */
export default function TwoFactorCard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [step, setStep] = useState<'idle' | 'password' | 'scan' | 'codes' | 'disable' | 'regenerate'>('idle')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState('')
  const [qr, setQr] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get('/auth/2fa').then((res) => setStatus(res.data.data)).catch(() => setStatus(null))

  useEffect(() => {
    load()
  }, [])

  const reset = (next: typeof step = 'idle') => {
    setStep(next)
    setPassword('')
    setCode('')
    setError('')
  }

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(errorText(e, fallback))
    } finally {
      setBusy(false)
    }
  }

  const startSetup = () =>
    run(async () => {
      const res = await api.post('/auth/2fa/setup', { password })
      const { secret: s, otpauthUrl } = res.data.data
      setSecret(s)
      setQr(await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 192 }))
      setPassword('')
      setStep('scan')
    }, 'Could not start setup')

  const confirm = () =>
    run(async () => {
      const res = await api.post('/auth/2fa/enable', { code: code.replace(/\s/g, '') })
      setRecoveryCodes(res.data.data.recoveryCodes)
      setSecret('')
      setQr('')
      setCode('')
      setStep('codes')
      await load()
    }, 'That code did not work')

  // A 6-digit code or a recovery code (anything else).
  const factor = () => (/^\d{6}$/.test(code.replace(/\s/g, '')) ? { code: code.replace(/\s/g, '') } : { recoveryCode: code.trim() })

  const disable = () =>
    run(async () => {
      await api.post('/auth/2fa/disable', { password, ...factor() })
      reset()
      await load()
    }, 'Could not turn it off')

  const regenerate = () =>
    run(async () => {
      const res = await api.post('/auth/2fa/recovery-codes', { password, ...factor() })
      setRecoveryCodes(res.data.data.recoveryCodes)
      setPassword('')
      setCode('')
      setStep('codes')
      await load()
    }, 'Could not create new codes')

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck size={18} className="text-gray-400" />
        <h3 className="font-semibold text-gray-900">Two-factor sign-in</h3>
        {status && <Badge color={status.enabled ? 'green' : 'gray'}>{status.enabled ? 'On' : 'Off'}</Badge>}
      </div>
      <p className="mb-4 text-sm text-gray-500">
        After your password, sign-in also asks for a code from an authenticator app (Google Authenticator,
        Microsoft Authenticator, Authy…).
      </p>

      {step === 'codes' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Save these recovery codes now</p>
          <p className="text-xs text-gray-500">
            Each code signs you in once if you lose your phone. They will not be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 font-mono text-sm text-gray-800">
            {recoveryCodes.map((c) => <span key={c}>{c}</span>)}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(recoveryCodes.join('\n'))}>
              <Copy size={14} /> Copy
            </Button>
            <Button onClick={() => { setRecoveryCodes([]); reset() }}>I have saved them</Button>
          </div>
        </div>
      )}

      {step === 'idle' && status && !status.enabled && (
        <Button onClick={() => reset('password')}><ShieldCheck size={15} /> Turn on</Button>
      )}

      {step === 'idle' && status?.enabled && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            On since {status.enabledAt ? new Date(status.enabledAt).toLocaleDateString() : '—'} ·{' '}
            {status.recoveryCodesLeft} recovery code{status.recoveryCodesLeft === 1 ? '' : 's'} left
          </p>
          {status.recoveryCodesLeft <= 3 && (
            <p className="text-xs text-amber-700">You are running low on recovery codes. Create new ones.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => reset('regenerate')}><KeyRound size={14} /> New recovery codes</Button>
            <Button variant="danger" onClick={() => reset('disable')}><ShieldOff size={14} /> Turn off</Button>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Confirm your password</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <Button onClick={startSetup} disabled={!password || busy}>Continue</Button>
            <Button variant="secondary" onClick={() => reset()}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 'scan' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">1. Scan this with your authenticator app.</p>
          {qr && <img src={qr} alt="QR code for your authenticator app" className="h-48 w-48 rounded-lg border border-gray-100" />}
          <p className="text-xs text-gray-500">
            Can't scan? Enter this key: <span className="select-all break-all font-mono text-gray-800">{secret}</span>
          </p>
          <label className="block text-sm text-gray-700">2. Enter the 6-digit code it shows</label>
          <input
            className={`${inputCls} font-mono tracking-widest`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123 456"
          />
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={code.replace(/\s/g, '').length !== 6 || busy}>Turn on</Button>
            <Button variant="secondary" onClick={() => reset()}>Cancel</Button>
          </div>
        </div>
      )}

      {(step === 'disable' || step === 'regenerate') && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <label className="block text-sm font-medium text-gray-700">Authenticator code or a recovery code</label>
          <input className={`${inputCls} font-mono`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456 or XXXX-XXXX" />
          <div className="flex gap-2">
            <Button
              variant={step === 'disable' ? 'danger' : 'primary'}
              onClick={step === 'disable' ? disable : regenerate}
              disabled={!password || !code || busy}
            >
              {step === 'disable' ? 'Turn off' : 'Create new codes'}
            </Button>
            <Button variant="secondary" onClick={() => reset()}>Cancel</Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
