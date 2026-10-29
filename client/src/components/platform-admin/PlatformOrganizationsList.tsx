import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'

import { useGetOrganizationsQuery } from '@/features/organizations/organizationsApi'
import type { Organization } from '@/features/organizations/types'
import CreateOrganizationModal from './CreateOrganizationModal'
import DeleteOrganizationDialog from './DeleteOrganizationDialog'
import { useCanManageOrganizations } from './useCanManageOrganizations'

const PAGE_SIZE = 12

const TYPE_FILTERS = ['school', 'college', 'coaching', 'institute', 'company', 'startup', 'ngo', 'others']

const STATUS_TONE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-amber-50 text-amber-700 border-amber-100',
  suspended: 'bg-red-50 text-red-700 border-red-100',
}

function titleCase(value?: string) {
  return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

/** Platform-wide organization list for super admins: search, create, delete. */
export default function PlatformOrganizationsList() {
  const navigate = useNavigate()
  const canManage = useCanManageOrganizations()

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Organization | null>(null)

  const { data, isLoading, isFetching, isError, refetch } = useGetOrganizationsQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    type: type || undefined,
  })

  const orgs = data?.data ?? []
  const total = data?.total ?? orgs.length
  const pages = Math.max(1, data?.pages ?? Math.ceil(total / PAGE_SIZE))

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            <Building2 size={14} /> Platform
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">Every tenant on the platform. {total} total.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-black"
          >
            <Plus size={16} /> New organization
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="Search by name or description…"
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-gray-900 focus:bg-white"
            />
          </div>
          <select
            value={type}
            onChange={(e) => resetPage(setType)(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All types</option>
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>{titleCase(t)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-gray-900">Failed to load organizations</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm text-gray-600 underline">
              Try again
            </button>
          </div>
        ) : orgs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Building2 size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 font-semibold text-gray-900">No organizations found</p>
            <p className="mt-1 text-sm text-gray-500">
              {search || type ? 'Try changing your filters.' : 'Create the first tenant to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Members</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const id = org.publicId ?? org._id
                  return (
                    <tr
                      key={id}
                      onClick={() => navigate(`/dashboard/organizations/${id}`)}
                      className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
                            {org.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{org.name}</p>
                            <p className="truncate text-xs text-gray-400">
                              {org.orgCode ?? '—'}
                              {org.contact?.email ? ` · ${org.contact.email}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{titleCase(org.type)}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{titleCase(org.plan || 'free')}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            STATUS_TONE[org.status] ?? 'border-gray-200 bg-gray-100 text-gray-600'
                          }`}
                        >
                          {titleCase(org.status || 'active')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900">
                        {org.membersCount ?? 0}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {canManage && (
                          <button
                            type="button"
                            title={`Delete ${org.name}`}
                            aria-label={`Delete ${org.name}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleting(org)
                            }}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="rounded-lg border border-gray-200 p-1.5 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {creating && <CreateOrganizationModal onClose={() => setCreating(false)} />}
      {deleting && (
        <DeleteOrganizationDialog
          organization={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            // Step back if we just emptied the last page.
            if (orgs.length === 1 && page > 1) setPage(page - 1)
          }}
        />
      )}
    </div>
  )
}
