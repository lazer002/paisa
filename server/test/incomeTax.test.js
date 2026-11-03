import test from "node:test";
import assert from "node:assert/strict";

import {
  computeAnnualTax,
  compareRegimes,
  financialYearOf,
  financialYearBounds,
  fyMonthIndex,
  monthlyTds,
} from "../src/services/incomeTax.js";

const FY = "2025-26";

test("financial years run April to March", () => {
  assert.equal(financialYearOf(new Date(2026, 3, 1)), "2026-27");
  assert.equal(financialYearOf(new Date(2026, 2, 31)), "2025-26");
  assert.equal(financialYearOf(new Date(2099, 11, 1)), "2099-00");
  assert.equal(financialYearBounds("2026-27").start.getMonth(), 3);
  assert.equal(fyMonthIndex(4), 0);
  assert.equal(fyMonthIndex(3), 11);
  assert.equal(fyMonthIndex(11), 7);
});

test("new regime: nil tax up to ₹12 lakh taxable (₹12.75 lakh salary)", () => {
  const r = computeAnnualTax({ grossSalary: 1275000, regime: "new", financialYear: FY });
  assert.equal(r.taxableIncome, 1200000);
  assert.equal(r.slabTax, 60000);
  assert.equal(r.rebate, 60000);
  assert.equal(r.totalTax, 0);
});

test("new regime: marginal relief just above ₹12 lakh", () => {
  // Taxable 12,10,000: slab tax 61,500 but capped at the 10,000 above the limit.
  const r = computeAnnualTax({ grossSalary: 1285000, regime: "new", financialYear: FY });
  assert.equal(r.taxableIncome, 1210000);
  assert.equal(r.slabTax, 61500);
  assert.equal(r.totalTax, 10400); // 10,000 + 4% cess
});

test("new regime: normal slab tax with cess above the relief band", () => {
  // Taxable 13,00,000: 20,000 + 40,000 + 15,000 = 75,000; +4% = 78,000.
  const r = computeAnnualTax({ grossSalary: 1375000, regime: "new", financialYear: FY });
  assert.equal(r.slabTax, 75000);
  assert.equal(r.rebate, 0);
  assert.equal(r.totalTax, 78000);
});

test("old regime: deductions, PF in 80C, cap and rebate", () => {
  // 10,00,000 − 50,000 std − 1,50,000 80C (1,00,000 declared + 60,000 PF, capped) = 8,00,000.
  const r = computeAnnualTax({ grossSalary: 1000000, regime: "old", declared: { section80C: 100000 }, employeePf: 60000, financialYear: FY });
  assert.equal(r.deductions.items.section80C, 150000);
  assert.equal(r.taxableIncome, 800000);
  assert.equal(r.slabTax, 72500); // 12,500 + 60,000
  assert.equal(r.totalTax, 75400);

  const small = computeAnnualTax({ grossSalary: 550000, regime: "old", financialYear: FY });
  assert.equal(small.taxableIncome, 500000);
  assert.equal(small.totalTax, 0);
});

test("surcharge above ₹50 lakh", () => {
  const r = computeAnnualTax({ grossSalary: 6075000, regime: "new", financialYear: FY });
  assert.equal(r.taxableIncome, 6000000);
  assert.equal(r.surchargeRate, 10);
  // slabs: 20k+40k+60k+80k+1L = 3,00,000 up to 24L; 30% of 36L = 10,80,000 → 13,80,000
  assert.equal(r.slabTax, 1380000);
  assert.equal(r.totalTax, Math.round((1380000 * 1.1) * 1.04));
});

test("comparison picks the cheaper regime", () => {
  const c = compareRegimes({ grossSalary: 1000000, declared: { section80C: 150000, section80D: 25000, homeLoanInterest: 200000 }, financialYear: FY });
  assert.equal(c.new.totalTax, 0);
  assert.equal(c.better, "new");
});

test("unknown year falls back to the latest rules", () => {
  const r = computeAnnualTax({ grossSalary: 1275000, financialYear: "2030-31" });
  assert.equal(r.rulesAssumed, true);
  assert.equal(r.totalTax, 0);
});

test("monthly TDS spreads the remaining tax", () => {
  assert.equal(monthlyTds({ projectedAnnualTax: 78000, taxDeductedSoFar: 0, monthsRemaining: 12 }), 6500);
  assert.equal(monthlyTds({ projectedAnnualTax: 78000, taxDeductedSoFar: 39000, monthsRemaining: 6 }), 6500);
  assert.equal(monthlyTds({ projectedAnnualTax: 10000, taxDeductedSoFar: 20000, monthsRemaining: 3 }), 0);
});
