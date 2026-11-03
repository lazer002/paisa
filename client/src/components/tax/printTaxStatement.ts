import { DEDUCTION_LABELS, MONTHS, inr, type TaxStatement } from './types'

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/**
 * Print the annual tax statement (Form 16 style) through the browser's print
 * dialog. Not the official Form 16, which only TRACES issues.
 */
export function printTaxStatement(s: TaxStatement) {
  const win = window.open('', '_blank', 'width=900,height=900')
  if (!win) return false

  const t = s.tax
  const deductionRows = Object.entries(t.deductions.items)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td>${esc(DEDUCTION_LABELS[k as keyof typeof DEDUCTION_LABELS] ?? k)}</td><td class="n">${inr(v)}</td></tr>`)
    .join('')

  win.document.write(`<!doctype html><html><head><title>Tax statement ${esc(s.financialYear)} — ${esc(s.employee.name)}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:Inter,system-ui,'Segoe UI',sans-serif;color:#111;font-size:12px;margin:0}
h1{font-size:18px;margin:0 0 2px} h2{font-size:13px;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
.muted{color:#555} table{width:100%;border-collapse:collapse} td,th{padding:4px 6px;border-bottom:1px solid #eee;text-align:left}
th{font-size:11px;color:#555;text-transform:uppercase} .n{text-align:right;font-variant-numeric:tabular-nums}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px} .total td{font-weight:700;border-top:1px solid #999}
.note{margin-top:18px;font-size:10px;color:#666}
</style></head><body>
<h1>Annual tax statement — FY ${esc(s.financialYear)}</h1>
<p class="muted">Salary and tax deducted at source (Form 16 style summary)</p>
<div class="grid">
  <div><b>Employer</b><br>${esc(s.employer.name ?? '—')}</div>
  <div><b>Employee</b><br>${esc(s.employee.name)}${s.employee.userCode ? ` (${esc(s.employee.userCode)})` : ''}<br>PAN: ${esc(s.employee.pan ?? 'not on file')}</div>
</div>

<h2>Salary paid</h2>
<table><thead><tr><th>Month</th><th class="n">Gross</th><th class="n">PF</th><th class="n">Prof. tax</th><th class="n">TDS</th><th class="n">Net</th></tr></thead><tbody>
${s.months.map((m) => `<tr><td>${MONTHS[m.month - 1]} ${m.year}</td><td class="n">${inr(m.gross)}</td><td class="n">${inr(m.pf)}</td><td class="n">${inr(m.professionalTax)}</td><td class="n">${inr(m.tds)}</td><td class="n">${inr(m.net)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No processed payroll in this year</td></tr>'}
<tr class="total"><td>Total</td><td class="n">${inr(s.totals.gross)}</td><td class="n">${inr(s.totals.pf)}</td><td class="n">${inr(s.totals.professionalTax)}</td><td class="n">${inr(s.totals.tds)}</td><td class="n">${inr(s.totals.net)}</td></tr>
</tbody></table>

<h2>Tax computation (${t.regime === 'old' ? 'old' : 'new'} regime)</h2>
<table><tbody>
<tr><td>Gross salary</td><td class="n">${inr(t.grossSalary)}</td></tr>
<tr><td>Standard deduction</td><td class="n">− ${inr(t.standardDeduction)}</td></tr>
${deductionRows}
<tr class="total"><td>Taxable income</td><td class="n">${inr(t.taxableIncome)}</td></tr>
<tr><td>Tax on income (slabs)</td><td class="n">${inr(t.slabTax)}</td></tr>
${t.rebate ? `<tr><td>Rebate u/s 87A</td><td class="n">− ${inr(t.rebate)}</td></tr>` : ''}
${t.surcharge ? `<tr><td>Surcharge</td><td class="n">${inr(t.surcharge)}</td></tr>` : ''}
<tr><td>Health &amp; education cess (4%)</td><td class="n">${inr(t.cess)}</td></tr>
<tr class="total"><td>Total tax payable</td><td class="n">${inr(t.totalTax)}</td></tr>
<tr><td>Tax deducted at source</td><td class="n">${inr(s.taxDeducted)}</td></tr>
<tr class="total"><td>${s.balance >= 0 ? 'Balance payable' : 'Refundable'}</td><td class="n">${inr(Math.abs(s.balance))}</td></tr>
</tbody></table>

<p class="note">Computed with the ${esc(t.rulesYear)} rules${t.rulesAssumed ? ' (this year\'s rules are assumed to be unchanged)' : ''}.
This summary is generated from payroll records and is not the official Form 16 (issued through TRACES).</p>
<script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
  return true
}
