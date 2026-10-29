import { useState, type ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

import Modal from '@/components/ui/Modal'

export interface ConfirmDeleteDialogProps {
  open: boolean
  title: string
  /** The exact name of the record being removed — shown in bold. */
  entityName: string
  /** What the server will actually do (soft delete, deactivate, …). */
  description: ReactNode
  /** Bullet list of side effects the user should know about. */
  consequences?: string[]
  /** When true the user must type `entityName` before the button enables. */
  requireTypedName?: boolean
  confirmLabel?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Destructive-action confirmation that always names the target record.
 * Render it conditionally (`{target && <ConfirmDeleteDialog … />}`) so the
 * typed-name state resets for every new target.
 */
export default function ConfirmDeleteDialog({
  open,
  title,
  entityName,
  description,
  consequences = [],
  requireTypedName = false,
  confirmLabel = 'Delete',
  busy = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState('')
  const nameMatches = !requireTypedName || typed.trim() === entityName.trim()

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 text-sm text-gray-600">
            <p>
              You are about to remove{' '}
              <span className="break-words font-semibold text-gray-900">{entityName}</span>.
            </p>
            <div className="mt-1.5 text-xs leading-5 text-gray-500">{description}</div>
          </div>
        </div>

        {consequences.length > 0 && (
          <ul className="list-disc space-y-1 rounded-xl border border-gray-100 bg-gray-50 py-3 pl-8 pr-4 text-xs leading-5 text-gray-600">
            {consequences.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {requireTypedName && (
          <label className="block text-xs font-medium text-gray-700">
            Type <span className="font-semibold text-gray-900">{entityName}</span> to confirm
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoFocus
              disabled={busy}
              className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-red-500"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !nameMatches}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
