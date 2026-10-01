import { useState } from 'react'
import { Plus, Trophy, Award, Zap, Medal } from 'lucide-react'

import {
  useGetAchievementsQuery,
  useCreateAchievementMutation,
  useDeleteAchievementMutation,
  useAwardAchievementMutation,
  useGetUserAchievementsQuery,
  useAwardPointsMutation,
  useGetLeaderboardQuery,
  type Achievement,
  type UserAchievement,
} from '@/features/platform/platformApi'
import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'
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

export default function GamificationPage() {
  const user = useAppSelector((s) => s.auth.user)
  const canManage = ['super_admin', 'admin', 'hr', 'teacher'].includes(user?.role ?? '')

  const [tab, setTab] = useState<TabId>('leaderboard')
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'critical' } | null>(null)

  const { data: achievements } = useGetAchievementsQuery()
  const { data: awards } = useGetUserAchievementsQuery()
  const { data: leaderboard } = useGetLeaderboardQuery()
  const { data: users } = useGetUsersQuery(undefined, { skip: !canManage })

  const [createAchievement] = useCreateAchievementMutation()
  const [deleteAchievement] = useDeleteAchievementMutation()
  const [awardAchievement] = useAwardAchievementMutation()
  const [awardPoints] = useAwardPointsMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [awardFor, setAwardFor] = useState<Achievement | null>(null)
  const [awardUserId, setAwardUserId] = useState('')
  const [pointsUserId, setPointsUserId] = useState('')
  const [pointsValue, setPointsValue] = useState('50')
  const [pointsReason, setPointsReason] = useState('')

  const [name, setName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [rarity, setRarity] = useState('common')
  const [points, setPoints] = useState('50')

  const submitAchievement = async () => {
    if (!name) return
    try {
      await createAchievement({ name, shortDescription: shortDescription || undefined, rarity, points: Number(points) || 10 }).unwrap()
      setShowCreate(false)
      setName(''); setShortDescription('')
      setToast({ msg: 'Achievement created', tone: 'success' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create'
      setToast({ msg: (e as { data?: { message?: string } })?.data?.message ?? message, tone: 'critical' })
    }
  }

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
      render: (a) =>
        canManage && (
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setAwardFor(a)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Award
            </button>
            <button
              onClick={() => deleteAchievement(rid(a))}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              ✕
            </button>
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
        actions={canManage ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setTab('achievements')}>
              <Plus size={15} /> Achievement
            </Button>
          </div>
        ) : undefined}
      />

      <Tabs<TabId>
        tabs={[
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'achievements', label: 'Achievements', count: achievements?.length },
          { id: 'awards', label: 'Recent Awards', count: awards?.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'leaderboard' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <SectionCard title="Top 50 by points">
            <div className="space-y-1.5">
              {(leaderboard ?? []).slice(0, 20).map((row) => (
                <div
                  key={row.userId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    row.rank <= 3 ? 'bg-amber-50/70' : 'hover:bg-gray-50'
                  }`}
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
                    <p className="truncate text-sm font-medium text-gray-800">{row.name}</p>
                    <p className="text-xs text-gray-400">{row.userCode ?? ''}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Zap size={13} /> {row.points}
                  </span>
                </div>
              ))}
              {(leaderboard ?? []).length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">No points recorded yet — award some to start the race</p>
              )}
            </div>
          </SectionCard>

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
          emptyAction={canManage ? (
            <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Achievement</Button>
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

      {/* Create achievement */}
      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Achievement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submitAchievement}>Create</Button>
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
