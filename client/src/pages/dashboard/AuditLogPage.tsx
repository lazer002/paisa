import { useState } from 'react'

import { useGetAuditLogsQuery, type AuditLogEntry } from '@/features/audit/auditApi'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import { DataTable, Toolbar, SelectFilter, StatusBadge, type Column } from '@/components/ui/kit'
import ExportMenu from '@/components/ui/ExportMenu'
import { fmtDateTime, humanize, type ExportColumn } from '@/lib/export'

// The API caps one request at 100 rows (auditController MAX_PAGE_SIZE).
const PAGE_SIZES = [25, 50, 100]

const EXPORT_COLUMNS: ExportColumn<AuditLogEntry>[] = [
  { header: 'When', value: (l) => fmtDateTime(l.createdAt) },
  { header: 'Actor', value: (l) => l.name ?? l.email ?? 'System' },
  { header: 'Actor email', value: (l) => l.email ?? '' },
  { header: 'Role', value: (l) => humanize(l.role) },
  { header: 'Category', value: (l) => humanize(l.category) },
  { header: 'Action', value: (l) => humanize(l.action) },
  { header: 'Details', value: (l) => l.description ?? l.resourceType ?? '' },
  { header: 'Method', value: (l) => l.request?.method ?? '' },
  { header: 'Route', value: (l) => l.request?.route ?? '' },
  { header: 'Result', value: (l) => l.request?.statusCode ?? '' },
]

const CATEGORIES = [
  'authentication', 'authorization', 'user_management', 'organization', 'education',
  'attendance', 'hr', 'payroll', 'finance', 'crm', 'communication', 'support',
  'content', 'reporting', 'security', 'system',
]

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery({
    page,
    limit: pageSize,
    category,
    search,
  })

  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (l) => <span className="text-gray-500">{new Date(l.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => (
        <div>
          <p className="font-medium text-gray-900">{l.name ?? l.email ?? 'System'}</p>
          <p className="text-xs capitalize text-gray-400">{l.role?.replace(/_/g, ' ') ?? '—'}</p>
        </div>
      ),
    },
    { key: 'action', header: 'Action', render: (l) => <StatusBadge status={l.action} /> },
    {
      key: 'what',
      header: 'Details',
      render: (l) => (
        <p className="max-w-md truncate text-gray-600" title={l.description ?? ''}>
          {l.description ?? l.resourceType ?? '—'}
        </p>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      render: (l) => <span className="text-gray-500">{l.request?.statusCode ?? '—'}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        subtitle="Who did what, and when, across your organization"
        actions={
          <ExportMenu
            title="Audit log"
            subtitle={
              [
                category ? `Category: ${humanize(category)}` : '',
                search ? `Search: "${search}"` : '',
                `Page ${page} of ${pages}`,
              ]
                .filter(Boolean)
                .join(' · ')
            }
            note={`Exports the current page only (page ${page} of ${pages}, ${total} entries in total). Raise "Rows per page" to 100 to export more at once.`}
            columns={EXPORT_COLUMNS}
            rows={data?.items ?? []}
          />
        }
      />

      <Toolbar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search actor or description..."
        filters={
          <SelectFilter
            label="Category"
            value={category}
            onChange={(v) => { setCategory(v); setPage(1) }}
            options={[
              { value: '', label: 'All categories' },
              ...CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
            ]}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={data?.items}
        keyOf={(l) => l._id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No audit entries"
        emptyHint="Actions taken in the system will be recorded here"
      />

      <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-gray-500">
        <label className="flex items-center gap-1.5">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <span>Page {page} of {pages} · {total} entries</span>
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
