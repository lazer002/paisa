import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { LogIn, LogOut, MapPin, Trash2, KeyRound, Pencil, ScanLine, Maximize2 } from 'lucide-react'

import api from '@/lib/api/axios'
import QrScanner from './QrScanner'
import { attendanceLink, canScanInPage, extractAttendanceCode } from './qr'

import {
  useSelfCheckMutation,
  useScanQrMutation,
  useOpenQrSessionMutation,
  useGetQrSessionsQuery,
  useCloseQrSessionMutation,
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  browserTimezone,
  type Geofence,
  type QrSessionOpened,
} from '@/features/attendance/attendanceApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import Button from '@/components/ui/button'
import { inputCls, Toast, StatusBadge } from '@/components/ui/kit'
import { usePermission } from '@/lib/auth/usePermission'

type ToastState = { msg: string; tone: 'success' | 'critical' } | null

const errorMessage = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
    <div>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
    {children}
  </div>
)

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not available in this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Location permission was denied')), {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  })

/** Staff check-in / check-out. Sends the device location so the server can check the geofence. */
export function SelfCheckPanel() {
  const [selfCheck] = useSelfCheckMutation()
  const [busy, setBusy] = useState<'in' | 'out' | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const run = async (action: 'in' | 'out') => {
    setBusy(action)
    try {
      let location: { latitude?: number; longitude?: number; accuracy?: number } = {}
      try {
        const pos = await getPosition()
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
      } catch {
        // The server decides whether a location is required.
      }
      await selfCheck({ action, timezone: browserTimezone(), ...location }).unwrap()
      setToast({ msg: action === 'in' ? 'Checked in' : 'Checked out', tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not complete check-in'), tone: 'critical' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card title="Check in" hint="Your location is used to confirm you are at an approved place">
      <div className="flex gap-2">
        <Button onClick={() => run('in')} loading={busy === 'in'}><LogIn size={15} /> Check in</Button>
        <Button variant="secondary" onClick={() => run('out')} loading={busy === 'out'}>
          <LogOut size={15} /> Check out
        </Button>
      </div>
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}

/**
 * Staff arriving from a scanned kiosk QR (?kiosk=CODE&k=KIOSK): check in or
 * out once, then drop the parameters. Renders only the result.
 */
export function KioskScanHandler() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult] = useState<ToastState>(null)
  const code = searchParams.get('kiosk')
  const kioskId = searchParams.get('k')
  const used = useRef(false)

  useEffect(() => {
    if (!code || !kioskId || used.current) return
    used.current = true
    setSearchParams({}, { replace: true })
    api
      .post('/attendance/kiosk-check', { kioskId, code, timezone: browserTimezone() })
      .then((res) => setResult({ msg: res.data.message, tone: 'success' }))
      .catch((e) =>
        setResult({
          msg: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Kiosk check-in failed',
          tone: 'critical',
        }),
      )
  }, [code, kioskId, setSearchParams])

  return result ? <Toast message={result.msg} tone={result.tone} onDone={() => setResult(null)} /> : null
}

/** Admin: attendance kiosks (screens showing a rotating check-in QR). */
export function KiosksPanel() {
  const [kiosks, setKiosks] = useState<{ publicId: string; name: string; lastSeenAt: string | null }[]>([])
  const [name, setName] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const load = useCallback(
    () =>
      api
        .get('/attendance/kiosks')
        .then((res) => setKiosks(res.data.data))
        .catch(() => setToast({ msg: 'Could not load kiosks', tone: 'critical' })),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    if (!name.trim()) return
    try {
      const res = await api.post('/attendance/kiosks', { name: name.trim() })
      setCreated(`${window.location.origin}${res.data.data.path}`)
      setName('')
      await load()
    } catch (e) {
      setToast({ msg: errorMessage((e as { response?: unknown }).response, 'Could not add the kiosk'), tone: 'critical' })
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remove this kiosk? Its screen stops working.')) return
    await api.delete(`/attendance/kiosks/${id}`)
    await load()
  }

  return (
    <Card title="Attendance kiosks" hint="A screen at the entrance shows a QR that changes every 30 s; staff scan it with their phone to check in or out">
      <div className="flex gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Kiosk name, e.g. Main gate" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={add} disabled={!name.trim()}>Add kiosk</Button>
      </div>
      {created && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Open this link on the kiosk screen (shown only once):
          <span className="mt-1 block select-all break-all font-mono text-xs">{created}</span>
        </div>
      )}
      {kiosks.length > 0 && (
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">
          {kiosks.map((k) => (
            <div key={k.publicId} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-gray-700">
                {k.name}
                <span className="ml-2 text-xs text-gray-400">{k.lastSeenAt ? `last online ${new Date(k.lastSeenAt).toLocaleString()}` : 'never opened'}</span>
              </span>
              <button onClick={() => remove(k.publicId)} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}

/**
 * Student side: type the code the teacher shows, scan its QR here, or arrive
 * from the phone camera with ?code= in the link (submitted automatically).
 */
export function ClassCodePanel() {
  const [scanQr, { isLoading }] = useScanQrMutation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const submit = useCallback(
    async (value: string) => {
      if (!value.trim()) return
      try {
        const res = await scanQr(value.trim()).unwrap()
        setCode('')
        setToast({ msg: (res as { message?: string } | undefined)?.message ?? 'Attendance marked', tone: 'success' })
      } catch (e) {
        setToast({ msg: errorMessage(e, 'Could not mark attendance'), tone: 'critical' })
      }
    },
    [scanQr],
  )

  // Arrived from a scanned class QR: use its code once, then drop it from the URL.
  const linkCode = extractAttendanceCode(searchParams.get('code'))
  const usedLink = useRef(false)
  useEffect(() => {
    if (!linkCode || usedLink.current) return
    usedLink.current = true
    setSearchParams({}, { replace: true })
    void submit(linkCode)
  }, [linkCode, setSearchParams, submit])

  const onScanned = useCallback(
    (scanned: string) => {
      setScanning(false)
      void submit(scanned)
    },
    [submit],
  )

  return (
    <Card title="Class attendance code" hint="Scan the QR your teacher shows (phone camera works too) or type the code">
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-[12rem] font-mono uppercase tracking-widest`}
          placeholder="ABCD2345"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={() => submit(code)} loading={isLoading}><KeyRound size={15} /> Mark me present</Button>
        {canScanInPage() && !scanning && (
          <Button variant="secondary" onClick={() => setScanning(true)}><ScanLine size={15} /> Scan QR</Button>
        )}
      </div>
      {scanning && <QrScanner onCode={onScanned} onClose={() => setScanning(false)} />}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}

/** The opened code as a QR (encodes the attendance link) with a full-screen view for projecting. */
function OpenedCode({ opened }: { opened: QrSessionOpened }) {
  const [qr, setQr] = useState('')
  const [fullScreen, setFullScreen] = useState(false)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(attendanceLink(opened.code), { margin: 1, width: 480 })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(''))
    return () => {
      cancelled = true
    }
  }, [opened.code])

  const until = new Date(opened.expiresAt).toLocaleTimeString()

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-4 text-center sm:flex-row sm:text-left">
        {qr && <img src={qr} alt={`QR code for class code ${opened.code}`} className="h-40 w-40 rounded-lg bg-white p-1" />}
        <div className="space-y-1">
          <p className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">{opened.code}</p>
          <p className="text-xs text-gray-400">Valid until {until} — this code is not shown again</p>
          <Button size="sm" variant="secondary" onClick={() => setFullScreen(true)}>
            <Maximize2 size={14} /> Show full screen
          </Button>
        </div>
      </div>

      {fullScreen && (
        <div
          role="dialog"
          aria-label="Class attendance code"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6"
          onClick={() => setFullScreen(false)}
        >
          {qr && <img src={qr} alt={`QR code for class code ${opened.code}`} className="h-[min(70vh,70vw)] w-[min(70vh,70vw)]" />}
          <p className="font-mono text-5xl font-bold tracking-[0.3em] text-gray-900">{opened.code}</p>
          <p className="text-sm text-gray-500">Scan with your phone camera or type the code · valid until {until} · click to close</p>
        </div>
      )}
    </>
  )
}

/** Teacher / admin side: open a short-lived code for one class. */
export function OpenSessionPanel() {
  const { data: classes } = useGetClassesQuery()
  const { data: sessions } = useGetQrSessionsQuery()
  const [openSession, { isLoading }] = useOpenQrSessionMutation()
  const [closeSession] = useCloseQrSessionMutation()

  const [classId, setClassId] = useState('')
  const [minutes, setMinutes] = useState('10')
  const [opened, setOpened] = useState<QrSessionOpened | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const start = async () => {
    if (!classId) return
    try {
      setOpened(await openSession({ classId, minutes: Number(minutes) || 10 }).unwrap())
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not open the session'), tone: 'critical' })
    }
  }

  const active = (sessions ?? []).filter((s) => s.status === 'active' && new Date(s.expiresAt) > new Date())

  return (
    <Card title="Class attendance code" hint="Students scan the QR or type the code to mark themselves present">
      <div className="flex flex-wrap items-end gap-2">
        <select className={`${inputCls} max-w-xs`} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select class</option>
          {(classes ?? []).map((c) => (
            <option key={rid(c)} value={rid(c)}>{c.name}</option>
          ))}
        </select>
        <input
          className={`${inputCls} w-24`}
          type="number"
          min={1}
          max={60}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          title="Minutes the code stays valid"
        />
        <Button onClick={start} loading={isLoading} disabled={!classId}>Start session</Button>
      </div>

      {opened && <OpenedCode opened={opened} />}

      {active.length > 0 && (
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">
          {active.map((s) => (
            <div key={s._id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-gray-700">
                {typeof s.classId === 'object' && s.classId ? s.classId.name : 'Class'} · {s.scanCount ?? 0} marked
              </span>
              <button
                onClick={() => closeSession(s.publicId ?? s._id)}
                className="text-xs font-medium text-rose-600 hover:underline"
              >
                Close
              </button>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}

/** One check-in area: shows its details, or an inline edit form. */
function GeofenceRow({
  fence,
  onToast,
}: {
  fence: Geofence
  onToast: (t: ToastState) => void
}) {
  const { can } = usePermission()
  const [updateGeofence, { isLoading }] = useUpdateGeofenceMutation()
  const [deleteGeofence] = useDeleteGeofenceMutation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(fence.name)
  const [latitude, setLatitude] = useState(String(fence.center?.latitude ?? ''))
  const [longitude, setLongitude] = useState(String(fence.center?.longitude ?? ''))
  const [radius, setRadius] = useState(String(fence.radiusMeters ?? 150))
  const [status, setStatus] = useState<'active' | 'inactive'>(fence.status === 'inactive' ? 'inactive' : 'active')

  const id = fence.publicId ?? fence._id

  const save = async () => {
    if (!name.trim() || !latitude || !longitude) return
    try {
      await updateGeofence({
        id,
        payload: {
          name: name.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radius) || 150,
          status,
        },
      }).unwrap()
      setEditing(false)
      onToast({ msg: 'Check-in area updated', tone: 'success' })
    } catch (e) {
      onToast({ msg: errorMessage(e, 'Could not update area'), tone: 'critical' })
    }
  }

  if (editing) {
    return (
      <div className="grid grid-cols-2 gap-2 px-3 py-2 sm:grid-cols-6">
        <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        <input className={inputCls} placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        <input
          className={inputCls}
          type="number"
          min={1}
          placeholder="Radius (m)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
        <select
          className={inputCls}
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          title="Inactive areas are ignored at check-in"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} loading={isLoading}>Save</Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-gray-700">
        {fence.name}{' '}
        <span className="text-xs text-gray-400">
          {fence.center?.latitude.toFixed(4)}, {fence.center?.longitude.toFixed(4)} · {fence.radiusMeters} m
        </span>
        {fence.status && fence.status !== 'active' && (
          <span className="ml-2"><StatusBadge status={fence.status} /></span>
        )}
      </span>
      <span className="flex gap-1">
        {can('geofence:update') && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
        )}
        {can('geofence:delete') && (
          <button
            onClick={() => deleteGeofence(id)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </span>
    </div>
  )
}

/** Admin: approved check-in areas. With none configured, check-in is accepted anywhere. */
export function GeofencePanel() {
  const { data: fences } = useGetGeofencesQuery()
  const [createGeofence, { isLoading }] = useCreateGeofenceMutation()

  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radius, setRadius] = useState('150')
  const [toast, setToast] = useState<ToastState>(null)

  const useMyLocation = async () => {
    try {
      const pos = await getPosition()
      setLatitude(pos.coords.latitude.toFixed(6))
      setLongitude(pos.coords.longitude.toFixed(6))
    } catch (e) {
      setToast({ msg: (e as Error).message, tone: 'critical' })
    }
  }

  const add = async () => {
    if (!name.trim() || !latitude || !longitude) return
    try {
      await createGeofence({
        name: name.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radius) || 150,
      }).unwrap()
      setName(''); setLatitude(''); setLongitude('')
      setToast({ msg: 'Check-in area added', tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not add area'), tone: 'critical' })
    }
  }

  return (
    <Card
      title="Check-in areas"
      hint="Staff can only check in inside one of these circles. Leave empty to allow check-in anywhere."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        <input className={inputCls} placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        <input
          className={inputCls}
          type="number"
          min={1}
          placeholder="Radius (m)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={useMyLocation} title="Use my location"><MapPin size={15} /></Button>
          <Button onClick={add} loading={isLoading}>Add</Button>
        </div>
      </div>

      {(fences ?? []).length > 0 && (
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100">
          {(fences ?? []).map((f) => (
            <GeofenceRow key={f._id} fence={f} onToast={setToast} />
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}
