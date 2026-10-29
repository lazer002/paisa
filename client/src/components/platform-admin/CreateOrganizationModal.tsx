import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import Modal from '@/components/ui/Modal'
import { useAddOrganizationMutation } from '@/features/organizations/organizationsApi'
import type { CreateOrgPayload, CreateOrgResult, OrgType } from '@/features/organizations/types'

import { apiErrorMessage } from './apiError'

/** Must match ORG_TYPES in server/src/models/organization.js. */
const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'college', label: 'College' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'institute', label: 'Institute' },
  { value: 'company', label: 'Company' },
  { value: 'startup', label: 'Startup' },
  { value: 'ngo', label: 'NGO' },
  { value: 'others', label: 'Others' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9]{10,15}$/

const inputCls =
  'mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900'

function FormField({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block text-xs font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] font-normal text-gray-400">{hint}</span>}
    </label>
  )
}

interface FormState {
  name: string
  type: OrgType | ''
  adminEmail: string
  adminName: string
  phone: string
  city: string
  state: string
  country: string
  website: string
  description: string
}

const EMPTY: FormState = {
  name: '',
  type: '',
  adminEmail: '',
  adminName: '',
  phone: '',
  city: '',
  state: '',
  country: 'India',
  website: '',
  description: '',
}

function validate(form: FormState): string | null {
  if (form.name.trim().length < 2) return 'Organization name must be at least 2 characters.'
  if (!form.type) return 'Choose an organization type.'
  if (!EMAIL_RE.test(form.adminEmail.trim())) return 'Enter a valid admin email address.'
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
    return 'Phone must be 10–15 digits (optionally starting with +).'
  }
  return null
}

function CreatedPanel({ result, onClose }: { result: CreateOrgResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const org = result.organization
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.temporaryPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — the password is still visible on screen
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">{org?.name ?? 'Organization'} was created.</p>
        <p className="mt-1 text-xs">
          An admin account was created for <strong>{result.admin?.email}</strong>. They must change this
          password on first login.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          <KeyRound size={12} /> Temporary password (shown once)
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900">
            {result.temporaryPassword}
          </code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Share it with the admin over a secure channel.</p>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        {org && (
          <Link
            to={`/dashboard/organizations/${org.publicId ?? org._id}`}
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open organization
          </Link>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black"
        >
          Done
        </button>
      </div>
    </div>
  )
}

/**
 * "New organization" form for super admins (POST /organizations).
 * Render conditionally so the form resets each time it opens.
 */
export default function CreateOrganizationModal({ onClose }: { onClose: () => void }) {
  const [addOrganization, { isLoading }] = useAddOrganizationMutation()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateOrgResult | null>(null)

  const set = (field: keyof FormState) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const problem = validate(form)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)

    const optional = (value: string) => value.trim() || undefined
    const payload: CreateOrgPayload = {
      name: form.name.trim(),
      type: form.type as OrgType,
      description: optional(form.description),
      website: optional(form.website),
      contact: {
        email: form.adminEmail.trim().toLowerCase(),
        name: optional(form.adminName),
        phone: optional(form.phone),
        city: optional(form.city),
        state: optional(form.state),
        country: optional(form.country),
      },
    }

    try {
      setResult(await addOrganization(payload).unwrap())
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create the organization'))
    }
  }

  return (
    <Modal open onClose={isLoading ? () => {} : onClose} title="New organization" size="lg">
      {result ? (
        <CreatedPanel result={result} onClose={onClose} />
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Organization name" required>
              <input value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputCls} autoFocus maxLength={100} />
            </FormField>
            <FormField label="Type" required>
              <select value={form.type} onChange={(e) => set('type')(e.target.value)} className={inputCls}>
                <option value="">Select type…</option>
                {ORG_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-900">First admin</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              The server creates an admin login with this email and returns a temporary password.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Admin email" required hint="Also stored as the organization's contact email.">
                <input type="email" value={form.adminEmail} onChange={(e) => set('adminEmail')(e.target.value)} className={inputCls} />
              </FormField>
              <FormField label="Admin name" hint="Defaults to the part of the email before @.">
                <input value={form.adminName} onChange={(e) => set('adminName')(e.target.value)} className={inputCls} />
              </FormField>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone">
              <input value={form.phone} onChange={(e) => set('phone')(e.target.value)} className={inputCls} placeholder="+919876543210" />
            </FormField>
            <FormField label="Website">
              <input value={form.website} onChange={(e) => set('website')(e.target.value)} className={inputCls} placeholder="https://" />
            </FormField>
            <FormField label="City">
              <input value={form.city} onChange={(e) => set('city')(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="State">
              <input value={form.state} onChange={(e) => set('state')(e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Country">
              <input value={form.country} onChange={(e) => set('country')(e.target.value)} className={inputCls} />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            />
          </FormField>

          {error && (
            <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Create organization
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
