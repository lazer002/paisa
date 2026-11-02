import { type ReactNode, useState } from 'react'
import { Plus, Trophy, Award, Zap, Medal, Pencil, Flame, TrendingUp } from 'lucide-react'

import {
  useGetAchievementsQuery,
  useCreateAchievementMutation,
  useUpdateAchievementMutation,
  useDeleteAchievementMutation,
  useAwardAchievementMutation,
  useGetUserAchievementsQuery,
  useAwardPointsMutation,
  useGetLeaderboardQuery,
  useGetMyGamificationQuery,
  useGetPointsLedgerQuery,
  type Achievement,
  type UserAchievement,
  type PointEntry,
  type LeaderboardPeriod,
} from '@/features/platform/platformApi'
import { ROLE_LABEL, type Role } from '@/config/roles'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { usePermission } from '@/lib/auth/usePermission'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import {
  DataTable, Tabs, StatusBadge, ModalShell, Field, inputCls, Toast, SectionCard,
  type Column,
} from '@/components/ui/kit'

type TabId = 'leaderboard' | 'achievements' | 'awards' | 'ledger'

const RARITY_RING: Record<string, string> = {
  common: 'ring-gray-200',
  uncommon: 'ring-emerald-200',
  rare: 'ring-sky-300',
  epic: 'ring-violet-300',
  legendary: 'ring-amber-300',
}

const PERIOD_LABEL: Record<LeaderboardPeriod, string> = { week: 'This week', month: 'This month', all: 'All time' }
const PERIOD_SHORT: Record<LeaderboardPeriod, string> = { week: 'Week', month: 'Month', all: 'All' }
const LEADERBOARD_ROLES: Role[] = ['student', 'teacher', 'employee', 'counselor', 'support', 'hr', 'accountant']
const POINT_RULE_LABEL: Record<string, string> = {
  assignment: 'assignment submitted',
  test: 'test submitted',
  attendance: 'check-in / class attendance',
}

function MyStat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="text-amber-600">{icon}</span> {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export default function GamificationPage() {
  const { can, canAny, canOwn } = usePermission()
  const canManage = canAny('achievement:create', 'point_ledger:create')
  const canCreateAchievement = can('achievement:create')
  const canAward = canAny('achievement:create', 'achievement:manage')
  // Creators may edit/delete their own achievements; managers any (server rule).
  const canEditAchievement = (a: Achievement) => canOwn('achievement:update', 'achievement:create', a)
  const canDeleteAchievement = (a: Achievement) => canOwn('achievement:delete', 'achievement:create', a)
  const canReadLedger = can('point_ledger:read')

  const [tab, setTab] = useState<TabId>('leaderboard')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: achievements } = useGetAchievementsQuery()
  const { data: awards } = useGetUserAchievementsQuery()
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const { data: board } = useGetLeaderboardQuery({ period, role: roleFilter || undefined })
  const { data: mine } = useGetMyGamificationQuery()
  const boardRows = board?.rows ?? []
  // Pin the caller's own row under the list when they are outside the top 20.
  const meOutsideTop = !!board?.me && board.me.rank > 20
  const { data: users } = useGetUsersQuery(undefined, { skip: !canManage })
  const { data: ledger, isLoading: ledgerLoading, isError: ledgerError, refetch: refetchLedger } =
    useGetPointsLedgerQuery(undefined, { skip: !canReadLedger || tab !== 'ledger' })

  const [createAchievement] = useCreateAchievementMutation()
  const [updateAchievement] = useUpdateAchievementMutation()
  const [deleteAchievement] = useDeleteAchievementMutation()
  const [awardAchievement] = useAwardAchievementMutation()
  const [awardPoints] = useAwardPointsMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [achievementStatus, setAchievementStatus] = useState('active')
  const [awardFor, setAwardFor] = useState<Achievement | null>(null)
  const [awardUserId, setAwardUserId] = useState('')
  const [pointsUserId, setPointsUserId] = useState('')
  const [pointsValue, setPointsValue] = useState('50')
  const [pointsReason, setPointsReason] = useState('')

  const [name, setName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [rarity, setRarity] = useState('common')
  const [points, setPoints] = useState('50')

  const openCreate = () => {
    setEditing(null)
    setName(''); setShortDescription(''); setRarity('common'); setPoints('50'); setAchievementStatus('active')
    setShowCreate(true)
  }

  const openEdit = (a: Achievement) => {
    setEditing(a)
    setName(a.name)
    setShortDescription(a.shortDescription ?? '')
    setRarity(a.rarity)
    setPoints(String(a.points ?? 0))
    setAchievementStatus(a.status)
    setShowCreate(true)
  }

  const submitAchievement = async () => {
    if (!name) return
    try {
      if (editing) {
        await updateAchievement({
          id: rid(editing),
          payload: {
            name,
            shortDescription: shortDescription || null,
            rarity,
            points: Number(points) || 0,
            status: achievementStatus,
          },
        }).unwrap()
      } else {
        await createAchievement({ name, shortDescription: shortDescription || undefined, rarity, points: Number(points) || 10 }).unwrap()
      }
      setShowCreate(false)
      setToast({ msg: editing ? 'Achievement updated' : 'Achievement created', tone: 'success' })
      setEditing(null)
      setName(''); setShortDescription('')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : editing ? 'Failed to update' : 'Failed to create'
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? message, tone: 'critical' })
    }
  }

  const ledgerColumns: Column<PointEntry>[] = [
    {
      key: 'user',
      header: 'User',
      render: (p) => (
        <div>
          <p className="font-medium text-gray-900">{typeof p.userId === 'object' ? p.userId?.name ?? '—' : '—'}</p>
          <p className="text-xs text-gray-400">{typeof p.userId === 'object' ? p.userId?.userCode ?? '' : ''}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (p) => <StatusBadge status={p.type} /> },
    {
      key: 'points',
      header: 'Points',
      render: (p) => {
        // Ledger stores absolute points; the sign comes from the balance movement.
        const delta = (p.balanceAfter ?? 0) - (p.balanceBefore ?? 0)
        const negative = delta < 0
        return (
          <span className={`font-medium ${negative ? 'text-rose-600' : 'text-amber-600'}`}>
            {negative ? '−' : '+'}{Math.abs(p.points)}
          </span>
        )
      },
    },
    { key: 'balance', header: 'Balance', render: (p) => <span className="text-gray-700">{p.balanceAfter ?? '—'}</span> },
    { key: 'reason', header: 'Reason', render: (p) => <span className="text-gray-500">{p.description ?? '—'}</span> },
    {
      key: 'when',
      header: 'When',
      render: (p) => <span className="text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>,
    },
  ]

  const giveAward = async () => {
    if (!awardFor || !awardUserId) return
    try {
      await awardAchievement({ userId: awardUserId, achievementId: rid(awardFor) }).unwrap()
      setAwardFor(null)
      setAwardUserId('')
      setToast({ msg: 'Achievement awarded + points granted', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Award failed (maybe already held)', tone: 'critical' })
    }
  }

  const givePoints = async () => {
    if (!pointsUserId || !pointsValue) return
    try {
      await awardPoints({ userId: pointsUserId, points: Number(pointsValue), reason: pointsReason || undefined }).unwrap()
      setPointsUserId(''); setPointsValue('50'); setPointsReason('')
      setToast({ msg: 'Points recorded', tone: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? 'Failed to record points', tone: 'critical' })
    }
  }

  const achievementColumns: Column<Achievement>[] = [
    {
      key: 'name',
      header: 'Achievement',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-2 ${RARITY_RING[a.rarity] ?? 'ring-gray-200'}`}>
            <Medal size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{a.name}</p>
            <p className="text-xs text-gray-400">{a.shortDescription ?? ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'rarity', header: 'Rarity', render: (a) => <StatusBadge status={a.rarity} /> },
    { key: 'points', header: 'Points', render: (a) => <span className="font-medium text-amber-600">+{a.points}</span> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-1.5">
          {canAward && (
            <button
              onClick={() => setAwardFor(a)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Award
            </button>
          )}
          {canEditAchievement(a) && (
            <button
              onClick={() => openEdit(a)}
              aria-label="Edit achievement"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDeleteAchievement(a) && (
            <button
              onClick={() => deleteAchievement(rid(a))}
              aria-label="Delete achievement"
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              ✕
            </button>
          )}
        </div>
      ),
    },
  ]

  const awardColumns: Column<UserAchievement>[] = [
    {
      key: 'user',
      header: 'User',
      render: (a) => (typeof a.userId === 'object' ? a.userId?.name ?? '—' : '—'),
    },
    {
      key: 'achievement',
      header: 'Achievement',
      render: (a) =>
        typeof a.achievementId === 'object' ? (
          <span className="flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> {a.achievementId?.name}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'when',
      header: 'Awarded',
      render: (a) => (
        <span className="text-gray-500">{a.awardedAt ? new Date(a.awardedAt).toLocaleDateString() : '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gamification"
        subtitle="Achievements, points, and friendly competition"
        actions={canCreateAchievement ? (
          <Button variant="secondary" onClick={() => { setTab('achievements'); openCreate() }}>
            <Plus size={15} /> Achievement
          </Button>
        ) : undefined}
      />

      <Tabs<TabId>
        tabs={[
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'achievements', label: 'Achievements', count: achievements?.length },
          { id: 'awards', label: 'Recent Awards', count: awards?.length },
          ...(canReadLedger ? [{ id: 'ledger' as TabId, label: 'Points Ledger' }] : []),
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'leaderboard' && mine && (
        <SectionCard title="My progress">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MyStat icon={<Zap size={16} />} label="Points" value={mine.points} />
            <MyStat icon={<Trophy size={16} />} label="Rank" value={mine.rank ? `#${mine.rank}` : '—'} />
            <MyStat icon={<TrendingUp size={16} />} label="This week" value={`+${mine.pointsThisWeek}`} />
            <MyStat
              icon={<Flame size={16} />}
              label="Day streak"
              value={mine.streak.current}
              hint={`Best ${mine.streak.longest}`}
            />
            <MyStat icon={<Award size={16} />} label="Badges" value={mine.achievements} />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Earn points automatically: {Object.entries(mine.pointRules).map(([source, pts]) => `${POINT_RULE_LABEL[source] ?? source} +${pts}`).join(' · ')}.
            Showing up on consecutive days builds your streak.
          </p>
        </SectionCard>
      )}

      {tab === 'leaderboard' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className={canManage ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <SectionCard
            title={`Top ${PERIOD_LABEL[period].toLowerCase()}`}
            actions={
              <div className="flex items-center gap-2">
                <select
                  aria-label="Filter by role"
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All roles</option>
                  {LEADERBOARD_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-gray-200 p-0.5" role="group" aria-label="Period">
                  {(Object.keys(PERIOD_LABEL) as LeaderboardPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      aria-pressed={period === p}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                        period === p ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {PERIOD_SHORT[p]}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="space-y-1.5">
              {[...boardRows.slice(0, 20), ...(meOutsideTop ? [board!.me!] : [])].map((row) => (
                <div
                  key={row.userId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    row.userId === board?.me?.userId
                      ? 'bg-sky-50 ring-1 ring-sky-200'
                      : row.rank <= 3 ? 'bg-amber-50/70' : 'hover:bg-gray-50'
                  } ${row === board?.me && meOutsideTop ? 'mt-3' : ''}`}
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      row.rank === 1
                        ? 'bg-amber-400 text-white'
                        : row.rank === 2
                          ? 'bg-gray-300 text-white'
                          : row.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {row.name}
                      {row.userId === board?.me?.userId && <span className="ml-1.5 text-xs font-normal text-sky-700">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {[row.userCode, row.role ? ROLE_LABEL[row.role as Role] ?? row.role : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Zap size={13} /> {row.points}
                  </span>
                </div>
              ))}
              {boardRows.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">
                  {period === 'all' && !roleFilter
                    ? 'No points recorded yet — submit work or check in to start the race'
                    : 'No points in this view yet'}
                </p>
              )}
            </div>
          </SectionCard>
          </div>

          {canManage && (
            <SectionCard title="Quick award points">
              <div className="space-y-4">
                <Field label="User" required>
                  <select className={inputCls} value={pointsUserId} onChange={(e) => setPointsUserId(e.target.value)}>
                    <option value="">— Select user —</option>
                    {(users ?? []).map((u) => (
                      <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </Field>
                <Field label="Points (negative to deduct)" required>
                  <input type="number" className={inputCls} value={pointsValue} onChange={(e) => setPointsValue(e.target.value)} />
                </Field>
                <Field label="Reason">
                  <input className={inputCls} value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} placeholder="Great class participation" />
                </Field>
                <Button onClick={givePoints} disabled={!pointsUserId} className="w-full justify-center">
                  <Zap size={15} /> Record Points
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {tab === 'achievements' && (
        <DataTable
          columns={achievementColumns}
          rows={achievements}
          keyOf={(a) => rid(a)}
          emptyTitle="No achievements defined"
          emptyHint="Create badges your people can earn"
          emptyAction={canCreateAchievement ? (
            <Button onClick={openCreate}><Plus size={15} /> New Achievement</Button>
          ) : undefined}
        />
      )}

      {tab === 'awards' && (
        <DataTable
          columns={awardColumns}
          rows={awards}
          keyOf={(a) => a.publicId ?? a._id}
          emptyTitle="No awards yet"
          emptyHint="Award achievements to celebrate wins"
        />
      )}

      {tab === 'ledger' && canReadLedger && (
        <DataTable
          columns={ledgerColumns}
          rows={ledger}
          keyOf={(p) => p.publicId ?? p._id}
          loading={ledgerLoading}
          error={ledgerError}
          onRetry={refetchLedger}
          emptyTitle="No point movements yet"
          emptyHint="Points awarded or deducted appear here"
        />
      )}

      {/* Create / edit achievement */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editing ? 'Edit Achievement' : 'New Achievement'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submitAchievement}>{editing ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perfect Attendance" />
          </Field>
          <Field label="Short description">
            <input className={inputCls} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Attended every class for a month" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rarity">
              <select className={inputCls} value={rarity} onChange={(e) => setRarity(e.target.value)}>
                {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Points">
              <input type="number" className={inputCls} value={points} onChange={(e) => setPoints(e.target.value)} />
            </Field>
          </div>
          {editing && (
            <Field label="Status">
              <select className={inputCls} value={achievementStatus} onChange={(e) => setAchievementStatus(e.target.value)}>
                {['draft', 'active', 'inactive', 'archived'].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </ModalShell>

      {/* Award achievement */}
      <ModalShell
        open={!!awardFor}
        onClose={() => setAwardFor(null)}
        title={`Award "${awardFor?.name ?? ''}"`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAwardFor(null)}>Cancel</Button>
            <Button onClick={giveAward} disabled={!awardUserId}><Trophy size={14} /> Award</Button>
          </>
        }
      >
        <Field label="Award to" required>
          <select className={inputCls} value={awardUserId} onChange={(e) => setAwardUserId(e.target.value)}>
            <option value="">— Select user —</option>
            {(users ?? []).map((u) => (
              <option key={rid(u)} value={rid(u)}>{u.name} ({u.role})</option>
            ))}
          </select>
        </Field>
      </ModalShell>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  )
}
