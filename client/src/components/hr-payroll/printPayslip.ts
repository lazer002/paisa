import type { PayslipData, PayrollLine } from '@/features/payroll/payrollApi'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const money = (n?: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0)

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const EARNING_LABELS: Record<string, string> = {
  hra: 'HRA', transport: 'Transport', medical: 'Medical', special: 'Special allowance',
  performance: 'Performance', overtime: 'Overtime', bonus: 'Bonus', other: 'Other earnings',
}

const DEDUCTION_LABELS: Record<string, string> = {
  pf: 'Provident fund', esi: 'ESI', tax: 'Income tax', professionalTax: 'Professional tax',
  loanRecovery: 'Loan recovery', lopAmount: 'Loss of pay', other: 'Other deductions',
}

/** Lines from the stored buckets (works for manual and generated payrolls). */
const bucketLines = (values: Record<string, number> | undefined, labels: Record<string, string>): PayrollLine[] =>
  Object.entries(labels)
    .map(([key, name]) => ({ code: key, name, amount: Number(values?.[key]) || 0 }))
    .filter((line) => line.amount > 0)

/** Opens a print-ready payslip in a new window (browser print → PDF). */
export function printPayslip({ payroll, employee, organization }: PayslipData) {
  const user = typeof payroll.employeeId === 'object' ? payroll.employeeId : undefined
  const calc = payroll.calculation
  const period = `${MONTHS[payroll.month - 1]} ${payroll.year}`

  const earnings: PayrollLine[] = [
    { code: 'BASIC', name: 'Basic', amount: payroll.basicSalary },
    ...bucketLines(payroll.allowances, EARNING_LABELS),
  ]
  const deductions = bucketLines(payroll.deductions, DEDUCTION_LABELS)
  const lopDays = payroll.deductions?.lopDays ?? calc?.lopDays ?? 0
  const gross = payroll.grossSalary ?? earnings.reduce((s, l) => s + l.amount, 0)
  const totalDeductions = payroll.totalDeductions ?? deductions.reduce((s, l) => s + l.amount, 0)

  const rows = Math.max(earnings.length, deductions.length)
  const lineRows = Array.from({ length: rows }, (_, i) => {
    const e = earnings[i]
    const d = deductions[i]
    return `<tr><td>${esc(e?.name ?? '')}</td><td class="num">${e ? esc(money(e.amount)) : ''}</td>
<td>${esc(d ? (d.code === 'lopAmount' ? `${d.name} (${lopDays} day${lopDays === 1 ? '' : 's'})` : d.name) : '')}</td><td class="num">${d ? esc(money(d.amount)) : ''}</td></tr>`
  }).join('')

  const summary = payroll.attendanceSummary
  const attendance = summary
    ? `<table class="grid"><tr>
<td><div class="k">Working days</div><div class="v">${esc(summary.workingDays)}</div></td>
<td><div class="k">Paid days</div><div class="v">${esc(calc?.paidDays ?? summary.workingDays - lopDays)}</div></td>
<td><div class="k">Present</div><div class="v">${esc(summary.presentDays)}</div></td>
<td><div class="k">Paid leave</div><div class="v">${esc(summary.paidLeaveDays)}</div></td>
<td><div class="k">LOP days</div><div class="v">${esc(lopDays)}</div></td>
</tr></table>
${calc ? `<p class="muted">LOP = unpaid leave ${esc(calc.unpaidLeaveDays)} + absent ${esc(calc.absentDays)} + unmarked ${esc(calc.unmarkedDays)} day(s).</p>` : ''}`
    : ''

  const win = window.open('', '_blank', 'width=800,height=960')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>Payslip ${esc(period)} - ${esc(employee?.name ?? user?.name ?? '')}</title>
<style>body{font-family:Inter,system-ui,sans-serif;color:#111;margin:40px}h1{font-size:20px;margin:0}
.muted{color:#666;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px}
.lines td,.lines th{padding:7px 6px;border-bottom:1px solid #eee;font-size:13px;text-align:left}
.lines th{background:#f6f6f6;font-weight:600}.num{text-align:right!important}
.grid td{border:1px solid #eee;padding:8px;font-size:13px}.k{color:#666;font-size:11px}.v{font-weight:600}
.info td{padding:3px 0;font-size:13px}.net{margin-top:20px;padding:12px;background:#f6f6f6;font-size:16px;font-weight:600;display:flex;justify-content:space-between}
</style></head><body>
<h1>${esc(organization?.name ?? 'PAISA')}</h1>
<p class="muted">${esc(organization?.contact?.email ?? '')} ${esc(organization?.contact?.phone ?? '')}</p>
<h2 style="font-size:16px;margin-top:24px">Payslip for ${esc(period)}</h2>
<table class="info">
<tr><td>Employee</td><td>${esc(employee?.name ?? user?.name ?? '—')}</td><td>Employee code</td><td>${esc(employee?.employeeCode ?? user?.userCode ?? '—')}</td></tr>
<tr><td>Designation</td><td>${esc(employee?.designation ?? '—')}</td><td>Department</td><td>${esc(employee?.department ?? '—')}</td></tr>
<tr><td>Status</td><td>${esc(payroll.status)}</td><td>Paid on</td><td>${esc(payroll.payment?.paidAt ? new Date(payroll.payment.paidAt).toLocaleDateString('en-IN') : '—')}</td></tr>
</table>
${attendance}
<table class="lines"><tr><th>Earnings</th><th class="num">Amount</th><th>Deductions</th><th class="num">Amount</th></tr>
${lineRows}
<tr><th>Gross earnings</th><th class="num">${esc(money(gross))}</th><th>Total deductions</th><th class="num">${esc(money(totalDeductions))}</th></tr>
</table>
<div class="net"><span>Net pay</span><span>${esc(money(payroll.netSalary))}</span></div>
<p class="muted" style="margin-top:24px">This is a computer-generated payslip.${calc?.structure ? ` Salary structure: ${esc(calc.structure.name)}.` : ''}</p>
<script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
}
