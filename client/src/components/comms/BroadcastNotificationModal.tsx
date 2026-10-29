import { useState } from 'react'

import { useBroadcastNotificationMutation } from '@/features/notifications/notificationsApi'
import { ALL_ROLES, ROLE_LABEL, type Role } from '@/config/roles'
import Button from '@/components/ui/button'
import { ModalShell, Field, inputCls } from '@/components/ui/kit'

// Broadcast stays inside the sender's organization, so platform admins are not a target.
const TARGET_ROLES = ALL_ROLES.filter((r) => r !== 'super_admin')

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'event', label: 'Event' },
  { value: 'system', label: 'System' },
]

/** POST /notifications/broadcast — an in-app notification to everyone in the org or to chosen roles. */
export default function BroadcastNotificationModal({
  open,
  onClose,
  onSent,
}: {
  open: boolean
  onClose: () => void
  onSent: (delivered: number) => void
}) {
  const [broadcast, { isLoading }] = useBroadcastNotificationMutation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('announcement')
  const [everyone, setEveryone] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [error, setError] = useState('')

  const toggleRole = (role: Role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))

  const canSend = title.trim() && (everyone || roles.length > 0)

  const send = async () => {
    if (!canSend) return
    setError('')
    try {
      const res = await broadcast({
        title: title.trim(),
        body: body.trim() || undefined,
        type,
        targetRoles: everyone ? undefined : roles,
      }).unwrap()
      setTitle(''); setBody(''); setRoles([]); setEveryone(true)
      onSent(res?.delivered ?? 0)
      onClose()
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? 'Failed to send notification')
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Send Notification"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={send} loading={isLoading} disabled={!canSend}>Send</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. School closed tomorrow"
          />
        </Field>
        <Field label="Message">
          <textarea
            className={inputCls}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional details"
          />
        </Field>
        <Field label="Type">
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Send to" required>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEveryone(true)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                everyone ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Everyone in the organization
            </button>
            {TARGET_ROLES.map((r) => {
              const on = !everyone && roles.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setEveryone(false); toggleRole(r) }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    on ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {ROLE_LABEL[r]}
                </button>
              )
            })}
          </div>
        </Field>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      </div>
    </ModalShell>
  )
}
