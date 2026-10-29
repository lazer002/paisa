import { useState } from 'react'
import { LogIn, LogOut, MapPin, Trash2, KeyRound } from 'lucide-react'

import {
  useSelfCheckMutation,
  useScanQrMutation,
  useOpenQrSessionMutation,
  useGetQrSessionsQuery,
  useCloseQrSessionMutation,
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useDeleteGeofenceMutation,
  browserTimezone,
  type QrSessionOpened,
} from '@/features/attendance/attendanceApi'
import { useGetClassesQuery } from '@/features/classes/classesApi'
import { rid } from '@/features/users/usersApi'
import Button from '@/components/ui/button'
import { inputCls, Toast } from '@/components/ui/kit'

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

/** Student side: enter the code the teacher shows in class. */
export function ClassCodePanel() {
  const [scanQr, { isLoading }] = useScanQrMutation()
  const [code, setCode] = useState('')
  const [toast, setToast] = useState<ToastState>(null)

  const submit = async () => {
    if (!code.trim()) return
    try {
      await scanQr(code.trim()).unwrap()
      setCode('')
      setToast({ msg: 'Attendance marked', tone: 'success' })
    } catch (e) {
      setToast({ msg: errorMessage(e, 'Could not mark attendance'), tone: 'critical' })
    }
  }

  return (
    <Card title="Class attendance code" hint="Enter the code your teacher shows in class">
      <div className="flex gap-2">
        <input
          className={`${inputCls} max-w-[12rem] font-mono uppercase tracking-widest`}
          placeholder="ABCD2345"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={submit} loading={isLoading}><KeyRound size={15} /> Mark me present</Button>
      </div>
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
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
    <Card title="Class attendance code" hint="Students enter this code to mark themselves present">
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

      {opened && (
        <div className="rounded-xl bg-gray-50 p-4 text-center">
          <p className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-900">{opened.code}</p>
          <p className="mt-1 text-xs text-gray-400">
            Valid until {new Date(opened.expiresAt).toLocaleTimeString()} — this code is not shown again
          </p>
        </div>
      )}

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

/** Admin: approved check-in areas. With none configured, check-in is accepted anywhere. */
export function GeofencePanel() {
  const { data: fences } = useGetGeofencesQuery()
  const [createGeofence, { isLoading }] = useCreateGeofenceMutation()
  const [deleteGeofence] = useDeleteGeofenceMutation()

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
            <div key={f._id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-gray-700">
                {f.name}{' '}
                <span className="text-xs text-gray-400">
                  {f.center?.latitude.toFixed(4)}, {f.center?.longitude.toFixed(4)} · {f.radiusMeters} m
                </span>
              </span>
              <button
                onClick={() => deleteGeofence(f.publicId ?? f._id)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </Card>
  )
}
