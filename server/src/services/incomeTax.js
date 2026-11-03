// server/src/services/incomeTax.js
//
// Income tax on salary (config/incomeTax.js): taxable income after the
// regime's deductions, slab tax, s.87A rebate (with marginal relief in the new
// regime), surcharge (no surcharge marginal relief) and health & education
// cess. Pure functions — payroll and the annual statement call them.

import { taxRulesFor } from "../config/incomeTax.js";

const round = (n) => Math.round(Number(n) || 0);

/** "2026-27" for any date from 1 April 2026 to 31 March 2027. */
export const financialYearOf = (date = new Date()) => {
  const d = new Date(date);
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

/** First and last day of a financial year ("2026-27" → 1 Apr 2026 … 31 Mar 2027). */
export const financialYearBounds = (financialYear) => {
  const start = Number(String(financialYear).slice(0, 4));
  return { start: new Date(start, 3, 1), end: new Date(start + 1, 2, 31, 23, 59, 59, 999), startYear: start };
};

/** Position of a calendar month in its financial year: April = 0 … March = 11. */
export const fyMonthIndex = (month) => (Number(month) - 4 + 12) % 12;

const slabTax = (taxable, slabs) => {
  let tax = 0;
  let lower = 0;
  const bands = [];

  for (const [upper, rate] of slabs) {
    if (taxable <= lower) break;
    const amount = Math.min(taxable, upper) - lower;
    const part = (amount * rate) / 100;
    if (rate > 0 && amount > 0) bands.push({ from: lower, to: Math.min(taxable, upper), rate, tax: round(part) });
    tax += part;
    lower = upper;
  }

  return { tax, bands };
};

/** Deductions a regime allows from the declared amounts (old regime only, capped). */
export const allowedDeductions = ({ regime, declared = {}, employeePf = 0, professionalTax = 0, rules }) => {
  if (regime !== "old") return { total: 0, items: {} };

  const caps = rules.old.caps;
  const items = {
    section80C: Math.min(caps.section80C, (Number(declared.section80C) || 0) + (Number(employeePf) || 0)),
    section80D: Math.min(caps.section80D, Number(declared.section80D) || 0),
    homeLoanInterest: Math.min(caps.homeLoanInterest, Number(declared.homeLoanInterest) || 0),
    nps80CCD1B: Math.min(caps.nps80CCD1B, Number(declared.nps80CCD1B) || 0),
    hraExemption: Math.max(0, Number(declared.hraExemption) || 0),
    professionalTax: Math.max(0, Number(professionalTax) || 0),
    other: Math.max(0, Number(declared.other) || 0),
  };

  return { total: Object.values(items).reduce((a, b) => a + b, 0), items };
};

/**
 * Annual tax on a salary.
 * @param grossSalary     yearly gross salary
 * @param regime          "new" | "old"
 * @param declared        employee declaration amounts (old regime)
 * @param employeePf      employee PF for the year (counts toward 80C, old regime)
 * @param professionalTax for the year (deductible in the old regime)
 */
export const computeAnnualTax = ({
  grossSalary,
  regime = "new",
  declared = {},
  employeePf = 0,
  professionalTax = 0,
  financialYear,
}) => {
  const { year, rules, assumed } = taxRulesFor(financialYear);
  const scheme = rules[regime] ?? rules.new;
  const gross = Math.max(0, Number(grossSalary) || 0);

  const standardDeduction = Math.min(scheme.standardDeduction, gross);
  const deductions = allowedDeductions({ regime, declared, employeePf, professionalTax, rules });
  const taxableIncome = Math.max(0, round(gross - standardDeduction - deductions.total));

  const { tax: baseTax, bands } = slabTax(taxableIncome, scheme.slabs);

  // s.87A rebate; above the limit the new regime's marginal relief keeps the
  // tax from exceeding the income over the limit.
  let rebate = 0;
  if (taxableIncome <= scheme.rebateIncomeLimit) {
    rebate = Math.min(baseTax, scheme.rebateMax);
  } else if (regime === "new") {
    rebate = Math.max(0, baseTax - (taxableIncome - scheme.rebateIncomeLimit));
  }

  const afterRebate = Math.max(0, baseTax - rebate);
  const surchargeRate = scheme.surcharge.find(([above]) => taxableIncome > above)?.[1] ?? 0;
  const surcharge = (afterRebate * surchargeRate) / 100;
  const cess = ((afterRebate + surcharge) * rules.cessPercent) / 100;

  return {
    financialYear: financialYear ?? year,
    rulesYear: year,
    rulesAssumed: assumed,
    regime,
    grossSalary: round(gross),
    standardDeduction: round(standardDeduction),
    deductions: { total: round(deductions.total), items: deductions.items },
    taxableIncome,
    slabTax: round(baseTax),
    bands,
    rebate: round(rebate),
    surchargeRate,
    surcharge: round(surcharge),
    cess: round(cess),
    totalTax: round(afterRebate + surcharge + cess),
  };
};

/** Both regimes side by side, and which one costs less. */
export const compareRegimes = (input) => {
  const newRegime = computeAnnualTax({ ...input, regime: "new" });
  const oldRegime = computeAnnualTax({ ...input, regime: "old" });

  return {
    new: newRegime,
    old: oldRegime,
    better: oldRegime.totalTax < newRegime.totalTax ? "old" : "new",
    saving: Math.abs(oldRegime.totalTax - newRegime.totalTax),
  };
};

/**
 * This month's TDS: the projected annual tax minus tax already deducted this
 * year, spread over the months left (this one included).
 */
export const monthlyTds = ({ projectedAnnualTax, taxDeductedSoFar, monthsRemaining }) =>
  Math.max(0, round((Number(projectedAnnualTax) - Number(taxDeductedSoFar || 0)) / Math.max(1, monthsRemaining)));
