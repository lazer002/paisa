// server/src/config/incomeTax.js
//
// Indian income-tax rules for salaried individuals below 60, per financial
// year (April–March). Slabs are [upper limit of the band, rate %].
//
// FY 2025-26 follows the Finance Act 2025 (new regime: standard deduction
// ₹75,000, nil tax up to ₹12 lakh taxable via the s.87A rebate; old regime:
// standard deduction ₹50,000, rebate up to ₹5 lakh).
// FY 2026-27: ASSUMED UNCHANGED from 2025-26 — update this entry when the
// year's Finance Act is known. A year missing here falls back to the latest.

const FY_2025_26 = {
  cessPercent: 4,

  new: {
    standardDeduction: 75000,
    slabs: [
      [400000, 0],
      [800000, 5],
      [1200000, 10],
      [1600000, 15],
      [2000000, 20],
      [2400000, 25],
      [Infinity, 30],
    ],
    // s.87A: tax nil up to this taxable income (with marginal relief above it).
    rebateIncomeLimit: 1200000,
    rebateMax: 60000,
    // [income above, surcharge %]; the new regime caps surcharge at 25%.
    surcharge: [
      [20000000, 25],
      [10000000, 15],
      [5000000, 10],
    ],
  },

  old: {
    standardDeduction: 50000,
    slabs: [
      [250000, 0],
      [500000, 5],
      [1000000, 20],
      [Infinity, 30],
    ],
    rebateIncomeLimit: 500000,
    rebateMax: 12500,
    surcharge: [
      [50000000, 37],
      [20000000, 25],
      [10000000, 15],
      [5000000, 10],
    ],
    // Deduction caps (chapter VI-A etc.). HRA exemption is declared as the
    // already-computed exempt amount.
    caps: {
      section80C: 150000,
      section80D: 75000,
      homeLoanInterest: 200000,
      nps80CCD1B: 50000,
    },
  },
};

export const TAX_YEARS = {
  "2025-26": FY_2025_26,
  "2026-27": FY_2025_26,
};

export const REGIMES = ["new", "old"];

/** Rules for a financial year, falling back to the latest known year. */
export const taxRulesFor = (financialYear) => {
  if (TAX_YEARS[financialYear]) return { year: financialYear, rules: TAX_YEARS[financialYear], assumed: false };
  const latest = Object.keys(TAX_YEARS).sort().pop();
  return { year: latest, rules: TAX_YEARS[latest], assumed: true };
};
