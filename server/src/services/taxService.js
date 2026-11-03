// server/src/services/taxService.js
//
// Income tax built from real payroll: the year-to-date figures, the monthly
// TDS a salary structure with `autoTds` deducts, and the annual tax statement
// (Form 16 style; the official Form 16 comes from TRACES).

import { Payroll } from "../models/Payroll.js";
import { TaxDeclaration } from "../models/TaxDeclaration.js";
import {
  compareRegimes,
  computeAnnualTax,
  financialYearOf,
  fyMonthIndex,
  monthlyTds,
} from "./incomeTax.js";

// Payroll that counts as paid salary for tax.
const COUNTED_STATUSES = ["processed", "approved", "paid"];

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Payroll rows of one person in a financial year, in month order. */
export const payrollsForYear = async ({ userId, instituteId, financialYear }) => {
  const startYear = Number(String(financialYear).slice(0, 4));

  const rows = await Payroll.find({
    employeeId: userId,
    instituteId,
    status: { $in: COUNTED_STATUSES },
    $or: [
      { year: startYear, month: { $gte: 4 } },
      { year: startYear + 1, month: { $lte: 3 } },
    ],
  })
    .select("month year grossSalary netSalary deductions status")
    .lean();

  return rows.sort((a, b) => fyMonthIndex(a.month) - fyMonthIndex(b.month));
};

const sumRows = (rows) =>
  rows.reduce(
    (t, p) => ({
      gross: t.gross + (p.grossSalary || 0),
      pf: t.pf + (p.deductions?.pf || 0),
      professionalTax: t.professionalTax + (p.deductions?.professionalTax || 0),
      tds: t.tds + (p.deductions?.tax || 0),
      net: t.net + (p.netSalary || 0),
    }),
    { gross: 0, pf: 0, professionalTax: 0, tds: 0, net: 0 }
  );

export const declarationFor = (userId, instituteId, financialYear) =>
  TaxDeclaration.findOne({ userId, instituteId, financialYear }).lean();

/**
 * TDS for one month: projected annual tax (actual earlier months + this
 * month's salary for the rest of the year) minus tax already deducted, spread
 * over the months left.
 */
export const projectedTdsFor = async ({ userId, instituteId, month, year, monthSalary }) => {
  const financialYear = financialYearOf(new Date(year, month - 1, 1));
  const index = fyMonthIndex(month);
  const remaining = 12 - index;

  const earlier = (await payrollsForYear({ userId, instituteId, financialYear })).filter(
    (p) => fyMonthIndex(p.month) < index
  );
  const ytd = sumRows(earlier);
  const declaration = await declarationFor(userId, instituteId, financialYear);
  const regime = declaration?.regime ?? "new";

  const annual = computeAnnualTax({
    grossSalary: ytd.gross + monthSalary.grossSalary * remaining,
    regime,
    declared: declaration?.deductions ?? {},
    employeePf: ytd.pf + (monthSalary.deductions?.pf || 0) * remaining,
    professionalTax: ytd.professionalTax + (monthSalary.deductions?.professionalTax || 0) * remaining,
    financialYear,
  });

  return {
    financialYear,
    regime,
    projectedAnnualTax: annual.totalTax,
    taxDeductedSoFar: r2(ytd.tds),
    monthsRemaining: remaining,
    amount: monthlyTds({ projectedAnnualTax: annual.totalTax, taxDeductedSoFar: ytd.tds, monthsRemaining: remaining }),
  };
};

/** Add auto TDS to a computed salary (payrollCalculator.computeSalary output). */
export const applyTds = (salary, tds) => {
  if (!tds) return salary;

  const deductions = { ...salary.deductions, tax: r2((salary.deductions.tax || 0) + tds) };
  const totalDeductions = r2(Math.min(salary.grossSalary, salary.totalDeductions + tds));

  return {
    ...salary,
    deductions,
    totalDeductions,
    netSalary: r2(Math.max(0, salary.grossSalary - totalDeductions)),
    lines: {
      ...salary.lines,
      deductions: [...(salary.lines?.deductions ?? []), { code: "TDS", name: "Income tax (TDS)", amount: tds }],
    },
  };
};

/**
 * The annual tax statement for one person: salary paid month by month, PF,
 * professional tax, TDS, the tax due on it under their regime, both regimes
 * compared, and — while the year is running — a full-year projection.
 */
export const annualStatement = async ({ user, organizationName, financialYear, now = new Date() }) => {
  const rows = await payrollsForYear({ userId: user._id, instituteId: user.instituteId, financialYear });
  const totals = sumRows(rows);
  const declaration = await declarationFor(user._id, user.instituteId, financialYear);
  const regime = declaration?.regime ?? "new";
  const declared = declaration?.deductions ?? {};

  const base = { declared, employeePf: totals.pf, professionalTax: totals.professionalTax, financialYear };
  const liability = computeAnnualTax({ ...base, grossSalary: totals.gross, regime });
  const comparison = compareRegimes({ ...base, grossSalary: totals.gross });

  // Year still running: assume the latest month's salary for every month
  // after it.
  const running = financialYearOf(now) === financialYear;
  const last = rows[rows.length - 1];
  const monthsLeft = running && last ? 11 - fyMonthIndex(last.month) : 0;
  const projection =
    running && last && monthsLeft > 0
      ? computeAnnualTax({
          grossSalary: totals.gross + (last.grossSalary || 0) * monthsLeft,
          regime,
          declared,
          employeePf: totals.pf + (last.deductions?.pf || 0) * monthsLeft,
          professionalTax: totals.professionalTax + (last.deductions?.professionalTax || 0) * monthsLeft,
          financialYear,
        })
      : null;

  return {
    financialYear,
    employer: { name: organizationName ?? null },
    employee: { publicId: user.publicId, name: user.name, userCode: user.userCode ?? null, pan: declaration?.pan ?? null },
    declaration: declaration
      ? { regime, deductions: declared, status: declaration.status, verifiedAt: declaration.verifiedAt ?? null }
      : null,
    months: rows.map((p) => ({
      month: p.month,
      year: p.year,
      gross: r2(p.grossSalary),
      pf: r2(p.deductions?.pf),
      professionalTax: r2(p.deductions?.professionalTax),
      tds: r2(p.deductions?.tax),
      net: r2(p.netSalary),
      status: p.status,
    })),
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, r2(v)])),
    tax: liability,
    taxDeducted: r2(totals.tds),
    balance: r2(liability.totalTax - totals.tds),
    comparison: { better: comparison.better, saving: comparison.saving, new: comparison.new.totalTax, old: comparison.old.totalTax },
    projection: projection
      ? { monthsAssumed: monthsLeft, grossSalary: projection.grossSalary, totalTax: projection.totalTax }
      : null,
  };
};
