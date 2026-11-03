export type Regime = 'new' | 'old'

export interface TaxDeductions {
  section80C?: number
  section80D?: number
  hraExemption?: number
  homeLoanInterest?: number
  nps80CCD1B?: number
  other?: number
}

export interface TaxDeclaration {
  publicId?: string
  financialYear: string
  regime: Regime
  deductions: TaxDeductions
  pan: string | null
  status: 'draft' | 'submitted' | 'verified' | null
  verifiedAt?: string | null
  user?: { publicId: string; name: string; userCode?: string; role?: string }
}

export interface TaxComputation {
  regime: Regime
  rulesYear: string
  rulesAssumed: boolean
  grossSalary: number
  standardDeduction: number
  deductions: { total: number; items: Record<string, number> }
  taxableIncome: number
  slabTax: number
  rebate: number
  surcharge: number
  cess: number
  totalTax: number
}

export interface TaxStatement {
  financialYear: string
  employer: { name: string | null }
  employee: { publicId: string; name: string; userCode: string | null; pan: string | null }
  declaration: { regime: Regime; status: string; verifiedAt: string | null } | null
  months: { month: number; year: number; gross: number; pf: number; professionalTax: number; tds: number; net: number; status: string }[]
  totals: { gross: number; pf: number; professionalTax: number; tds: number; net: number }
  tax: TaxComputation
  taxDeducted: number
  balance: number
  comparison: { better: Regime; saving: number; new: number; old: number }
  projection: { monthsAssumed: number; grossSalary: number; totalTax: number } | null
}

/** "2026-27" for today (April–March years). */
export const currentFinancialYear = (date = new Date()) => {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

export const previousFinancialYear = (fy: string) => {
  const start = Number(fy.slice(0, 4)) - 1
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`
}

export const inr = (n: number | null | undefined) =>
  `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const DEDUCTION_LABELS: Record<keyof TaxDeductions | 'professionalTax', string> = {
  section80C: '80C (PPF, ELSS, LIC, tuition…; PF counts here too)',
  section80D: '80D (health insurance)',
  hraExemption: 'HRA exemption (exempt amount)',
  homeLoanInterest: 'Home-loan interest (s.24b)',
  nps80CCD1B: 'NPS 80CCD(1B)',
  other: 'Other deductions',
  professionalTax: 'Professional tax',
}
