import { useState } from 'react'
import { Calculator, Eye, PlayCircle } from 'lucide-react'

import {
  useGeneratePayrollMutation,
  useGetSalaryAssignmentsQuery,
  useAssignSalaryStructureMutation,
  useLazyPreviewPayrollQuery,
  type GenerateSummary,
  type RunOptions,
} from '@/features/payroll/payrollApi'
import { useGetSalaryStructuresQuery } from '@/features/platform/platformApi'
import { rid } from '@/features/users/usersApi'
import { SectionCard, Field, inputCls } from '@/components/ui/kit'
import Button from '@/components/ui/button'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const money = (n?: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0)

const errorText = (e: unknown, fallback: string) =>
  (e as { data?: { message?: string } })?.data?.message ?? fallback

/** HR/admin: assign salary structures, preview one employee, generate a month. */
export default function PayrollRunPanel() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [saturdayOff, setSaturdayOff] = useState(false)
  const [unmarkedAsPresent, setUnmarkedAsPresent] = useState(false)
  const [previewUser, setPreviewUser] = useState('')
  const [summary, setSummary] = useState<GenerateSummary | null>(null)
  const [error, setError] = useState('')

  const { data: assignments } = useGetSalaryAssignmentsQuery()
  const { data: structures } = useGetSalaryStructuresQuery({ status: 'active' })
  const [assign] = useAssignSalaryStructureMutation()
  const [generate, { isLoading: generating }] = useGeneratePayrollMutation()
  const [loadPreview, { data: preview, isFetching: previewing, error: previewError }] = useLazyPreviewPayrollQuery()

  const options: RunOptions = { month, year, weeklyOff: saturdayOff ? [0, 6] : [0], unmarkedAsPresent }

  const runGenerate = async () => {
    setError('')
    try {
      setSummary(await generate(options).unwrap())
    } catch (e) {
      setError(errorText(e, 'Payroll generation failed'))
    }
  }

  const onAssign = async (userId: string, salaryStructureId: string) => {
    setError('')
    try {
      await assign({ userId, salaryStructureId: salaryStructureId || null }).unwrap()
    } catch (e) {
      setError(errorText(e, 'Could not assign the salary structure'))
    }
  }

  const calc = preview?.calculation

  return (
    <div className="space-y-4">
      <SectionCard
        title="Run payroll"
        subtitle="Calculated from each employee's salary structure, attendance and approved leaves. Paid, approved and manually entered payrolls are never overwritten."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Month">
            <select className={inputCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <input type="number" className={inputCls} value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
            <input type="checkbox" checked={saturdayOff} onChange={(e) => setSaturdayOff(e.target.checked)} />
            Saturday is a weekly off
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-gray-700">
            <input type="checkbox" checked={unmarkedAsPresent} onChange={(e) => setUnmarkedAsPresent(e.target.checked)} />
            Treat unmarked days as present
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          LOP days = unpaid leave + days marked absent + past working days with no attendance (unless treated as present).
          Sundays{saturdayOff ? ' and Saturdays' : ''} and days marked holiday are not working days; future days count as present.
          Working days before an employee's joining date or after their last working date are not paid (prorated).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={runGenerate} loading={generating}><PlayCircle size={16} /> Generate payroll for {MONTHS[month - 1]} {year}</Button>
        </div>
        {error && <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {summary && (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium">
              {summary.created} created · {summary.updated} updated · {summary.unchanged} unchanged · {summary.skipped.length} skipped
            </p>
            {summary.skipped.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-gray-500">
                {summary.skipped.map((s, i) => <li key={i}>{s.user?.name ?? 'Unknown'}: {s.reason}</li>)}
              </ul>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Preview one employee" subtitle="Nothing is saved.">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Employee">
              <select className={inputCls} value={previewUser} onChange={(e) => setPreviewUser(e.target.value)}>
                <option value="">— Select —</option>
                {(assignments ?? []).filter((a) => a.user).map((a) => (
                  <option key={a.employee.publicId} value={a.user?.publicId}>{a.user?.name} ({a.user?.role})</option>
                ))}
              </select>
            </Field>
          </div>
          <Button variant="secondary" disabled={!previewUser} loading={previewing}
            onClick={() => loadPreview({ ...options, userId: previewUser })}>
            <Eye size={16} /> Preview
          </Button>
        </div>
        {previewError && <p className="mt-2 text-sm text-red-600">{errorText(previewError, 'Preview failed')}</p>}
        {preview && calc && !previewError && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[
              ['Working days', calc.workingDays],
              ['Paid days', calc.paidDays],
              ['Present', calc.presentDays],
              ['Paid leave', calc.paidLeaveDays],
              ['Unpaid leave', calc.unpaidLeaveDays],
              ['Absent', calc.absentDays],
              ['Unmarked', calc.unmarkedDays],
              ['LOP days', calc.lopDays],
              ['Not employed', calc.notEmployedDays ?? 0],
              ['Gross', money(preview.grossSalary)],
              ['LOP amount', money(preview.deductions.lopAmount)],
              ['Deductions', money(preview.totalDeductions)],
              ['Net', money(preview.netSalary)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg bg-gray-50 p-2">
                <p className="text-xs text-gray-500">{k}</p>
                <p className="font-semibold text-gray-900">{v}</p>
              </div>
            ))}
            <p className="col-span-full text-xs text-gray-500">
              Structure: {calc.structure?.name ?? '—'} · per-day rate {money(calc.perDayRate)}
              {preview.existing ? ` · existing record: ${preview.existing.status} (${preview.existing.source ?? 'manual'})` : ''}
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Salary structures by employee" subtitle="Payroll is generated only for employees with an active structure.">
        {!assignments?.length ? (
          <p className="text-sm text-gray-500">No employee profiles found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-2 font-medium">Employee</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Salary structure</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.employee.publicId} className="border-b border-gray-50">
                    <td className="py-2">{a.user?.name ?? a.employee.name}<span className="ml-1 text-xs text-gray-400">{a.employee.employeeCode}</span></td>
                    <td className="py-2 capitalize text-gray-600">{a.user?.role ?? '—'}</td>
                    <td className="py-2">
                      <select className={inputCls} value={a.salaryStructure ? rid(a.salaryStructure) : ''}
                        disabled={!a.user}
                        onChange={(e) => a.user?.publicId && onAssign(a.user.publicId, e.target.value)}>
                        <option value="">— None —</option>
                        {(structures ?? []).map((s) => (
                          <option key={rid(s)} value={rid(s)}>{s.name} ({money(s.baseSalary)})</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><Calculator size={12} /> Create structures in HR Ops → Salary structures.</p>
      </SectionCard>
    </div>
  )
}
