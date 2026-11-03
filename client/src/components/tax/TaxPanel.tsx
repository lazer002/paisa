import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Printer, RotateCcw } from 'lucide-react'

import api from '@/lib/api/axios'
import { usePermission } from '@/lib/auth/usePermission'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { inputCls } from '@/components/ui/kit'
import { printTaxStatement } from './printTaxStatement'
import {
  DEDUCTION_LABELS,
  MONTHS,
  currentFinancialYear,
  inr,
  previousFinancialYear,
  type Regime,
  type TaxDeclaration,
  type TaxDeductions,
  type TaxStatement,
} from './types'

const errText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

const DEDUCTION_KEYS: (keyof TaxDeductions)[] = ['section80C', 'section80D', 'hraExemption', 'homeLoanInterest', 'nps80CCD1B', 'other']

function StatementView({ statement }: { statement: TaxStatement }) {
  const t = statement.tax
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Salary this year', inr(statement.totals.gross)],
          [`Tax (${t.regime} regime)`, inr(t.totalTax)],
          ['TDS deducted', inr(statement.taxDeducted)],
          [statement.balance >= 0 ? 'Still to pay' : 'Refund due', inr(Math.abs(statement.balance))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600">
        On this salary the <b>{statement.comparison.better}</b> regime costs less
        {statement.comparison.saving > 0 ? ` by ${inr(statement.comparison.saving)}` : ' (both cost the same)'} — new {inr(statement.comparison.new)}, old {inr(statement.comparison.old)}.
        {statement.projection && (
          <> For the full year ({statement.projection.monthsAssumed} more month{statement.projection.monthsAssumed === 1 ? '' : 's'} at the latest salary) the tax would be about <b>{inr(statement.projection.totalTax)}</b>.</>
        )}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">PF</th>
              <th className="px-3 py-2 text-right">Prof. tax</th>
              <th className="px-3 py-2 text-right">TDS</th>
              <th className="px-3 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {statement.months.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400">No processed payroll in this year yet</td></tr>
            )}
            {statement.months.map((m) => (
              <tr key={`${m.year}-${m.month}`} className="border-t border-gray-50">
                <td className="px-3 py-2">{MONTHS[m.month - 1]} {m.year}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(m.gross)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(m.pf)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(m.professionalTax)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(m.tds)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{inr(m.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.rulesAssumed && (
        <p className="text-xs text-amber-700">Tax rules for FY {statement.financialYear} are not configured yet; the {t.rulesYear} rules were used.</p>
      )}
    </div>
  )
}

/**
 * Income tax: the signed-in person's declaration and annual statement; payroll
 * managers and finance also see everyone's declarations and statements.
 */
export default function TaxPanel() {
  const { canAny } = usePermission()
  const canSeeOthers = canAny('payroll:create', 'payroll:update', 'payroll:manage', 'finance:read')
  const canVerify = canAny('payroll:update', 'payroll:manage')

  const thisYear = currentFinancialYear()
  const [fy, setFy] = useState(thisYear)
  const [declaration, setDeclaration] = useState<TaxDeclaration | null>(null)
  const [statement, setStatement] = useState<TaxStatement | null>(null)
  const [team, setTeam] = useState<TaxDeclaration[]>([])
  const [other, setOther] = useState<TaxStatement | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () =>
      Promise.all([
        api.get('/tax/declaration', { params: { financialYear: fy } }),
        api.get('/tax/statement', { params: { financialYear: fy } }),
        canSeeOthers ? api.get('/tax/declarations', { params: { financialYear: fy } }) : Promise.resolve(null),
      ])
        .then(([d, s, t]) => {
          setDeclaration(d.data.data)
          setStatement(s.data.data)
          setTeam(t ? t.data.data : [])
        })
        .catch((e) => setMessage({ text: errText(e, 'Could not load tax details'), ok: false })),
    [fy, canSeeOthers],
  )

  useEffect(() => {
    load()
  }, [load])

  const locked = declaration?.status === 'verified'
  const set = (patch: Partial<TaxDeclaration>) => setDeclaration((d) => (d ? { ...d, ...patch } : d))
  const setDeduction = (key: keyof TaxDeductions, value: string) =>
    setDeclaration((d) => (d ? { ...d, deductions: { ...d.deductions, [key]: Number(value) || 0 } } : d))

  const save = async () => {
    if (!declaration) return
    setSaving(true)
    setMessage(null)
    try {
      await api.put('/tax/declaration', {
        financialYear: fy,
        regime: declaration.regime,
        pan: declaration.pan || '',
        deductions: Object.fromEntries(DEDUCTION_KEYS.map((k) => [k, Number(declaration.deductions?.[k]) || 0])),
      })
      setMessage({ text: 'Declaration saved. Your TDS follows it from the next payroll run.', ok: true })
      await load()
    } catch (e) {
      setMessage({ text: errText(e, 'Could not save'), ok: false })
    } finally {
      setSaving(false)
    }
  }

  const verify = async (d: TaxDeclaration, reopen = false) => {
    try {
      await api.post(`/tax/declarations/${d.publicId}/verify`, reopen ? { reopen: true } : {})
      await load()
    } catch (e) {
      setMessage({ text: errText(e, 'Could not update the declaration'), ok: false })
    }
  }

  const openStatement = async (userId: string) => {
    try {
      const res = await api.get('/tax/statement', { params: { financialYear: fy, userId } })
      setOther(res.data.data)
    } catch (e) {
      setMessage({ text: errText(e, 'Could not load the statement'), ok: false })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600">
          Financial year{' '}
          <select className="ml-1 rounded-lg border border-gray-200 px-2 py-1 text-sm" value={fy} onChange={(e) => { setFy(e.target.value); setOther(null) }}>
            {[thisYear, previousFinancialYear(thisYear)].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        {message && <span className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{message.text}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Declaration */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">My tax declaration</h2>
            {declaration?.status && <Badge color={locked ? 'green' : 'blue'}>{locked ? 'verified by HR' : declaration.status}</Badge>}
          </div>
          {declaration && (
            <>
              <div className="flex gap-2" role="radiogroup" aria-label="Tax regime">
                {(['new', 'old'] as Regime[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={locked}
                    aria-pressed={declaration.regime === r}
                    onClick={() => set({ regime: r })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-left text-sm transition ${declaration.regime === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:opacity-60`}
                  >
                    <b className="capitalize">{r} regime</b>
                    <span className="block text-xs opacity-80">{r === 'new' ? 'Lower rates, ₹75k standard deduction, few deductions' : 'Higher rates, ₹50k standard deduction + 80C/80D/HRA…'}</span>
                  </button>
                ))}
              </div>
              {declaration.regime === 'old' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DEDUCTION_KEYS.map((k) => (
                    <label key={k} className="text-xs text-gray-500">
                      {DEDUCTION_LABELS[k]}
                      <input type="number" min={0} disabled={locked} className={inputCls} value={declaration.deductions?.[k] ?? 0} onChange={(e) => setDeduction(k, e.target.value)} />
                    </label>
                  ))}
                </div>
              )}
              <label className="block text-xs text-gray-500">
                PAN
                <input className={`${inputCls} uppercase`} disabled={locked} maxLength={10} placeholder="ABCDE1234F" value={declaration.pan ?? ''} onChange={(e) => set({ pan: e.target.value.toUpperCase() })} />
              </label>
              {locked ? (
                <p className="text-xs text-gray-500">Verified declarations are locked. Ask HR to reopen it to make changes.</p>
              ) : (
                <Button onClick={save} loading={saving}>Save declaration</Button>
              )}
            </>
          )}
        </section>

        {/* Statement */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">My annual tax statement</h2>
            {statement && (
              <Button size="sm" variant="secondary" onClick={() => printTaxStatement(statement)}><Printer size={14} /> Print</Button>
            )}
          </div>
          {statement ? <StatementView statement={statement} /> : <p className="text-sm text-gray-400">Loading…</p>}
        </section>
      </div>

      {canSeeOthers && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Team declarations · FY {fy}</h2>
          {team.length === 0 ? (
            <p className="text-sm text-gray-400">No declarations for this year yet. Without one, tax is worked out under the new regime.</p>
          ) : (
            <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100">
              {team.map((d) => (
                <li key={d.publicId} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{d.user?.name ?? '—'}</span>
                    <span className="ml-2 text-xs text-gray-400">{d.user?.userCode} · {d.regime} regime{d.pan ? ` · PAN ${d.pan}` : ''}</span>
                  </span>
                  <Badge color={d.status === 'verified' ? 'green' : 'blue'}>{d.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => d.user && openStatement(d.user.publicId)}>Statement</Button>
                  {canVerify && d.status !== 'verified' && (
                    <Button size="sm" onClick={() => verify(d)}><CheckCircle2 size={13} /> Verify</Button>
                  )}
                  {canVerify && d.status === 'verified' && (
                    <Button size="sm" variant="secondary" onClick={() => verify(d, true)}><RotateCcw size={13} /> Reopen</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {other && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{other.employee.name} · FY {other.financialYear}</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => printTaxStatement(other)}><Printer size={14} /> Print</Button>
                  <Button size="sm" variant="secondary" onClick={() => setOther(null)}>Close</Button>
                </div>
              </div>
              <StatementView statement={other} />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
