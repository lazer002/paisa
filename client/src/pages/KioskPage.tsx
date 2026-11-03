import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'

import api from '@/lib/api/axios'

interface KioskState {
  kioskId: string
  name: string
  organizationName: string | null
  code: string
  refreshInMs: number
}

/** "<origin>/dashboard/attendance?kiosk=CODE&k=KIOSK" — what staff phones open. */
const scanLink = (s: KioskState) =>
  `${window.location.origin}/dashboard/attendance?kiosk=${encodeURIComponent(s.code)}&k=${encodeURIComponent(s.kioskId)}`

/**
 * Full-screen attendance kiosk (public; the secret token in the URL identifies
 * it). Shows a QR that changes every 30 seconds; staff scan it with their
 * signed-in phone to check in or out.
 */
export default function KioskPage() {
  const { token = '' } = useParams()
  const [state, setState] = useState<KioskState | null>(null)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    let timer: number | undefined
    let stopped = false

    const tick = () =>
      api
        .get(`/public/kiosk/${encodeURIComponent(token)}`)
        .then(async (res) => {
          if (stopped) return
          const next: KioskState = res.data.data
          setState(next)
          setError('')
          setQr(await QRCode.toDataURL(scanLink(next), { margin: 1, width: 520 }))
          timer = window.setTimeout(tick, Math.max(2000, next.refreshInMs + 300))
        })
        .catch((e) => {
          if (stopped) return
          setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Kiosk offline. Retrying…')
          timer = window.setTimeout(tick, 10000)
        })

    tick()
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000)

    return () => {
      stopped = true
      window.clearTimeout(timer)
      window.clearInterval(clockTimer)
    }
  }, [token])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-400">{state?.organizationName ?? 'PAISA'}</p>
        <h1 className="text-3xl font-semibold text-gray-900">{state?.name ?? 'Attendance kiosk'}</h1>
      </div>
      {error && <p className="text-lg text-rose-600">{error}</p>}
      {qr && <img src={qr} alt="Attendance QR code" className="h-[min(60vh,80vw)] w-[min(60vh,80vw)]" />}
      {state && <p className="font-mono text-4xl font-bold tracking-[0.3em] text-gray-900">{state.code}</p>}
      <p className="text-lg text-gray-600">Scan with your phone to check in or out · the code changes every 30 seconds</p>
      <p className="font-mono text-2xl text-gray-400">{clock.toLocaleTimeString()}</p>
    </div>
  )
}
