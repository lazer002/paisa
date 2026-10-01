import { useMemo, useState } from 'react'
import { Plus, Trash2, Target, ArrowRightCircle } from 'lucide-react'

import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadMutation,
  useGetDealsQuery,
  useCreateDealMutation,
  useUpdateDealStageMutation,
  useDeleteDealMutation,
  type Lead,
  type Deal,
} from '@/features/platform/platformApi'
import { useAppSelector } from '@/app/store'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Toolbar, SelectFilter, StatusBadge, Tabs, ModalShell, Field, inputCls, Toast,
  type Column,
} from '@/components/ui/kit'

type TabId = 'leads' | 'deals'

const STAGES = ['qualification', 'proposal', 'negotiation', 'won', 'lost']

const STAGE_LABEL: Record<string, string> = {
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

export default function CRMPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = ['super_admin', 'admin'].includes(user?.role ?? '')

  const [tab, setTab] = useState<TabId>('leads')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: leads, isLoading, isError, refetch } = useGetLeadsQuery()
  const { data: deals } = useGetDealsQuery()

  const [createLead] = useCreateLeadMutation()
  const [updateLead] = useUpdateLeadMutation()
  const [deleteLead] = useDeleteLeadMutation()
  const [createDeal] = useCreateDealMutation()
  const [updateDealStage] = useUpdateDealStageMutation()
  const [deleteDeal] = useDeleteDealMutation()

  const [showLead, setShowLead] = useState(false)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [dealValue, setDealValue] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState('manual')
  const [estimatedValue, setEstimatedValue] = useState('')

  const filteredLeads = useMemo(
    () =>
      (leads ?? []).filter(
        (l) =>
          (!statusFilter || l.status === statusFilter) &&
          (!search ||
            `${l.firstName ?? ''} ${l.lastName ?? ''} ${l.company ?? ''}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [leads, search, statusFilter],
  )

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {}
    for (const stage of STAGES) map[stage] = []
    for (const d of deals ?? []) {
      ;(map[d.stage] ?? map.qualification).push(d)
    }
    return map
  }, [deals])

  const submitLead = async () => {
    if (!firstName && !company) return
    try {
      await createLead({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        company: company || undefined,
        email: email || undefined,
        phone: phone || undefined,
        source,
        estimatedValue: estimatedValue || 0,
      }).unwrap()
      setShowLead(false)
      setFirstName(''); setLastName(''); setCompany(''); setEmail(''); setPhone(''); setEstimatedValue('')
      setToast({ msg: 'Lead created', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to create lead', tone: 'critical' })
    }
  }

  const convert = async () => {
    if (!convertLead) return
    try {
      await createDeal({
        title: `${convertLead.firstName ?? ''} ${convertLead.lastName ?? ''}`.trim() || convertLead.company || 'New deal',
        leadId: convertLead.publicId ?? convertLead._id,
        value: dealValue || convertLead.estimatedValue || 0,
      }).unwrap()
      await updateLead({ id: convertLead.publicId ?? convertLead._id, payload: { status: 'qualified' } }).unwrap()
      setConvertLead(null)
      setDealValue('')
      setToast({ msg: 'Converted to deal', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Conversion failed', tone: 'critical' })
    }
  }

  const moveStage = async (d: Deal, stage: string) => {
    try {
      await updateDealStage({ id: d.publicId ?? d._id, stage, status: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open' }).unwrap()
      setToast({ msg: `Moved to ${STAGE_LABEL[stage]}`, tone: 'success' })
    } catch {
      setToast({ msg: 'Failed to move deal', tone: 'critical' })
    }
  }

  const leadColumns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead',
      render: (l) => (
        <div>
          <p className="font-medium text-gray-900">
            {[l.firstName, l.lastName].filter(Boolean).join(' ') || l.company || '—'}
          </p>
          <p className="text-xs text-gray-400">{l.company ?? l.contact?.email ?? ''}</p>
        </div>
      ),
    },
    { key: 'contact', header: 'Contact', render: (l) => <span className="text-gray-500">{l.contact?.email ?? l.contact?.phone ?? '—'}</span> },
    { key: 'source', header: 'Source', render: (l) => <span className="capitalize text-gray-500">{l.source}</span> },
    {
      key: 'value',
      header: 'Est. value',
      render: (l) => <span className="text-gray-700">₹{(l.estimatedValue ?? 0).toLocaleString()}</span>,
    },
    { key: 'priority', header: 'Priority', render: (l) => <StatusBadge status={l.priority} /> },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (l) =>
        canManage && (
          <div className="flex justify-end gap-1.5">
            {l.status !== 'qualified' && (
              <button
                onClick={() => setConvertLead(l)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                title="Convert to deal"
              >
                <ArrowRightCircle size={12} /> Convert
              </button>
            )}
            <button
              onClick={() => deleteLead(l.publicId ?? l._id)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="CRM"
        subtitle="Track leads from first contact to closed deals"
        actions={canManage ? <Button onClick={() => setShowLead(true)}><Plus size={15} /> New Lead</Button> : undefined}
      />

      <Tabs<TabId>
        tabs={[
          { id: 'leads', label: 'Leads', count: leads?.length },
          { id: 'deals', label: 'Deal Pipeline', count: deals?.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'leads' && (
        <>
          <Toolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search leads..."
            filters={
              <SelectFilter
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'new', label: 'New' },
                  { value: 'contacted', label: 'Contacted' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'disqualified', label: 'Disqualified' },
                ]}
              />
            }
          />
          <DataTable
            columns={leadColumns}
            rows={filteredLeads}
            keyOf={(l) => l.publicId ?? l._id}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            emptyTitle="No leads yet"
            emptyHint="Capture inquiries from your website, referrals, or walk-ins"
            emptyAction={canManage ? <Button onClick={() => setShowLead(true)}><Plus size={15} /> New Lead</Button> : undefined}
          />
        </>
      )}

      {tab === 'deals' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage] ?? []
            const total = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
            return (
              <div key={stage} className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-gray-600">{STAGE_LABEL[stage]}</p>
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="mb-2 px-1 text-[11px] text-gray-400">₹{total.toLocaleString()}</p>
                <div className="space-y-2">
                  {stageDeals.map((d) => (
                    <div key={d.publicId ?? d._id} className="group rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                      <p className="text-sm font-medium text-gray-800">{d.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">₹{(d.value ?? 0).toLocaleString()}</p>
                      {canManage && stage !== 'won' && stage !== 'lost' && (
                        <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          {STAGES.filter((s) => !['won', 'lost'].includes(s) && s !== stage).slice(0, 2).map((s) => (
                            <button
                              key={s}
                              onClick={() => moveStage(d, s)}
                              className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                              → {STAGE_LABEL[s]}
                            </button>
                          ))}
                          <button
                            onClick={() => moveStage(d, 'won')}
                            className="rounded border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Win
                          </button>
                          <button
                            onClick={() => deleteDeal(d.publicId ?? d._id)}
                            className="ml-auto rounded p-0.5 text-gray-300 transition hover:text-rose-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-6 text-[11px] text-gray-300">
                      <Target size={14} className="mr-1" /> Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New lead */}
      <ModalShell
        open={showLead}
        onClose={() => setShowLead(false)}
        title="New Lead"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLead(false)}>Cancel</Button>
            <Button onClick={submitLead}>Create Lead</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aarav" />
            </Field>
            <Field label="Last name">
              <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" />
            </Field>
          </div>
          <Field label="Company">
            <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp (optional)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aarav@example.com" />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Source">
              <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
                {['manual', 'website', 'referral', 'walk_in', 'campaign', 'other'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Estimated value (₹)">
              <input type="number" className={inputCls} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="50000" />
            </Field>
          </div>
        </div>
      </ModalShell>

      {/* Convert to deal */}
      <ModalShell
        open={!!convertLead}
        onClose={() => setConvertLead(null)}
        title="Convert Lead to Deal"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConvertLead(null)}>Cancel</Button>
            <Button onClick={convert}>Create Deal</Button>
          </>
        }
      >
        <Field label="Deal value (₹)">
          <input
            type="number"
            className={inputCls}
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            placeholder={String(convertLead?.estimatedValue ?? 0)}
          />
        </Field>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
