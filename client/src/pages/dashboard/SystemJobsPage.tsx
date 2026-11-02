import { useCallback, useEffect, useState } from 'react'
import { Play, RefreshCw } from 'lucide-react'

import api from '@/lib/api/axios'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import { LoadingGrid, ErrorState } from '@/components/ui/StateViews'

interface Job {
  name: string
  description: string
  everyMinutes: number
  lastStatus: 'never' | 'running' | 'success' | 'failed' | 'interrupted'
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastDurationMs: number | null
  lastResult: Record<string, unknown> | null
  lastError: string | null
  lastTrigger: 'schedule' | 'manual' | null
  runCount: number
  failCount: number
  nextRunAt: string | null
  running: boolean
}

const STATUS_TONE: Record<Job['lastStatus'], string> = {
  never: 'bg-gray-100 text-gray-600',
  running: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  interrupted: 'bg-amber-50 text-amber-700',
}

const every = (minutes: number) =>
  minutes % 1440 === 0 ? `Every ${minutes / 1440 === 1 ? '' : `${minutes / 1440} `}day` :
  minutes % 60 === 0 ? `Every ${minutes / 60 === 1 ? '' : `${minutes / 60} `}hour` :
  `Every ${minutes} min`

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—')

/** "markedOverdue: 3 · notified: 5" */
const resultText = (result: Record<string, unknown> | null) =>
  result
    ? Object.entries(result)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${v}`)
        .join(' · ')
    : '—'

/** Platform scheduled jobs: what ran, what it did, and a manual run button. */
export default function SystemJobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(
    () =>
      api
        .get('/jobs')
        .then((res) => {
          setError(false)
          setJobs(res.data.data)
        })
        .catch(() => setError(true)),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const run = async (job: Job) => {
    setBusy(job.name)
    setMessage(null)
    try {
      const res = await api.post(`/jobs/${job.name}/run`)
      setMessage({ text: res.data.message, ok: res.data.data?.lastStatus === 'success' })
      await load()
    } catch (e) {
      setMessage({
        text: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Run failed',
        ok: false,
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Jobs"
        subtitle="Background tasks that run on a schedule: overdue invoices, reminders, clean-up"
        actions={
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw size={15} /> Refresh
          </Button>
        }
      />

      {message && (
        <p className={`rounded-xl px-4 py-3 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          {message.text}
        </p>
      )}

      {error ? (
        <ErrorState onRetry={() => load()} />
      ) : !jobs ? (
        <LoadingGrid cards={4} height="h-24" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">Job</th>
                <th className="px-5 py-3">Schedule</th>
                <th className="px-5 py-3">Last run</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3 text-right">Runs</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.name} className="border-b border-gray-50 align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{job.name}</p>
                    <p className="max-w-xs text-xs text-gray-500">{job.description}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {every(job.everyMinutes)}
                    <p className="text-xs text-gray-400">next ≈ {when(job.nextRunAt)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[job.running ? 'running' : job.lastStatus]}`}>
                      {job.running ? 'running' : job.lastStatus}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      {when(job.lastStartedAt)}
                      {job.lastDurationMs !== null && ` · ${job.lastDurationMs} ms`}
                      {job.lastTrigger && ` · ${job.lastTrigger}`}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">
                    {job.lastError ? <span className="text-rose-600">{job.lastError}</span> : resultText(job.lastResult)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-700">
                    {job.runCount}
                    {job.failCount > 0 && <p className="text-xs text-rose-600">{job.failCount} failed</p>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={busy !== null || job.running}
                      onClick={() => run(job)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Play size={12} /> {busy === job.name ? 'Running…' : 'Run now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
