// server/src/services/payrollCalculator.js
//
// Pure payroll maths (no database access) so it can be unit tested.
//
// DAY RULES (per calendar day of the month, UTC dates):
// - Weekly off days (default Sunday) and days the employee's attendance marks
//   as holiday / week_off are NOT working days.
// - Every other day is a working day and is classified as:
//   1. covered by an approved leave: "unpaid" -> LOP (unpaid leave),
//      any other type -> paid leave. Half-day leaves cover 0.5 of the day.
//   2. the rest of the day comes from the staff attendance record:
//      present / late / excused -> present; half_day -> 0.5 present + 0.5
//      absent; absent / leave (leave marked without an approved request) ->
//      absent (LOP).
//   3. no attendance record: a day after "today" is assumed present (payroll
//      run before the month ends); otherwise it is an UNMARKED absence (LOP),
//      unless the run uses unmarkedAsPresent=true.
// - Working days before the employee's joining date or after their last
//   working date are "not employed" days: they are not classified (so they are
//   never LOP) and their pay is prorated away (see MONEY RULES).
// - LOP days = unpaid leave + absent + unmarked.
//   Paid days = working - not employed - LOP.
//
// MONEY RULES:
// - Monthly basic = structure.monthlyBaseSalary, else baseSalary (annual
//   structures divide by 12; daily = per working day; hourly = per hour x
//   working hours per day x working days).
// - Components (active, recurring) are computed like the structure's own
//   totals: fixed / percentage of basic, gross, ctc or another component /
//   per_day x working days / per_hour x hours x working days / formula
//   (services/salaryFormula.js; reads BASIC, GROSS, CTC, WORKING_DAYS,
//   PAID_DAYS, LOP_DAYS, HOURS_PER_DAY and earlier component codes).
//   per_unit = perUnitAmount x the unit count entered for this run
//   (units[code], 0 when none was entered).
// - Proration (mid-month joiners/leavers): basic and proratable earnings are
//   scaled by employed working days / working days. ESI eligibility uses the
//   full-month gross.
// - Gross = basic + earnings (after proration). LOP amount = (full basic +
//   full proratable earnings) / working days x LOP days (0 when the structure
//   disables LOP).
// - PF (if enabled) = employee % of earned basic (capped by the ceiling);
//   ESI (if enabled and gross <= wage ceiling) = employee % of earned gross.
// - Net = gross - (LOP amount + PF + ESI + other deductions), never below 0.

import { evaluateFormula } from "./salaryFormula.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESENT_STATUSES = new Set(["present", "late", "excused"]);
const NON_WORKING_STATUSES = new Set(["holiday", "week_off"]);
const HALF_DAY_DURATIONS = new Set(["half_day_morning", "half_day_evening"]);

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export const monthBounds = (month, year) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return { start, end, days };
};

const leaveUnits = (leave) =>
  HALF_DAY_DURATIONS.has(leave.duration) || leave.type === "half_day" ? 0.5 : 1;

/**
 * Classify every day of the month.
 * attendance: [{ date, status }] (staff records, classId null)
 * leaves: approved leaves [{ type, duration, startDate, endDate }]
 */
export const computeAttendanceBreakdown = ({
  month,
  year,
  attendance = [],
  leaves = [],
  weeklyOff = [0],
  unmarkedAsPresent = false,
  today = new Date(),
  joiningDate = null,
  lastWorkingDate = null,
}) => {
  const { start, days } = monthBounds(month, year);
  const todayKey = dayKey(today);
  const joinKey = joiningDate ? dayKey(joiningDate) : null;
  const exitKey = lastWorkingDate ? dayKey(lastWorkingDate) : null;

  const attendanceByDay = new Map();
  for (const record of attendance) {
    attendanceByDay.set(dayKey(record.date), record.status);
  }

  const leaveByDay = new Map();
  for (const leave of leaves) {
    const from = Math.max(Date.parse(dayKey(leave.startDate)), start.getTime());
    const to = Math.min(
      Date.parse(dayKey(leave.endDate)),
      start.getTime() + (days - 1) * DAY_MS
    );

    for (let t = from; t <= to; t += DAY_MS) {
      const key = dayKey(t);
      if (!leaveByDay.has(key)) leaveByDay.set(key, leave);
    }
  }

  const totals = {
    calendarDays: days,
    workingDays: 0,
    nonWorkingDays: 0,
    presentDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    absentDays: 0,
    unmarkedDays: 0,
    assumedPresentDays: 0,
    notEmployedDays: 0,
  };

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start.getTime() + i * DAY_MS);
    const key = dayKey(date);
    const status = attendanceByDay.get(key);

    if (weeklyOff.includes(date.getUTCDay()) || NON_WORKING_STATUSES.has(status)) {
      totals.nonWorkingDays += 1;
      continue;
    }

    totals.workingDays += 1;

    if ((joinKey && key < joinKey) || (exitKey && key > exitKey)) {
      totals.notEmployedDays += 1;
      continue;
    }

    let remaining = 1;
    const leave = leaveByDay.get(key);

    if (leave) {
      const units = leaveUnits(leave);
      if (leave.type === "unpaid") totals.unpaidLeaveDays += units;
      else totals.paidLeaveDays += units;
      remaining -= units;
    }

    if (remaining <= 0) continue;

    if (status) {
      if (PRESENT_STATUSES.has(status)) {
        totals.presentDays += remaining;
      } else if (status === "half_day") {
        const present = Math.min(remaining, 0.5);
        totals.presentDays += present;
        totals.absentDays += remaining - present;
      } else {
        totals.absentDays += remaining;
      }
    } else if (key > todayKey) {
      totals.presentDays += remaining;
      totals.assumedPresentDays += remaining;
    } else if (unmarkedAsPresent) {
      totals.presentDays += remaining;
      totals.assumedPresentDays += remaining;
    } else {
      totals.unmarkedDays += remaining;
    }
  }

  totals.lopDays = totals.unpaidLeaveDays + totals.absentDays + totals.unmarkedDays;
  totals.paidDays = totals.workingDays - totals.notEmployedDays - totals.lopDays;

  return totals;
};

const EARNING_BUCKET = {
  hra: "hra",
  transport: "transport",
  medical: "medical",
  special_allowance: "special",
  da: "special",
  bonus: "bonus",
  incentive: "bonus",
  commission: "bonus",
  overtime: "overtime",
};

const DEDUCTION_BUCKET = {
  pf: "pf",
  esi: "esi",
  professional_tax: "professionalTax",
  income_tax: "tax",
  loan: "loanRecovery",
  advance: "loanRecovery",
};

const monthlyBasicOf = (structure, workingDays) => {
  if (Number(structure.monthlyBaseSalary) > 0) return Number(structure.monthlyBaseSalary);

  const base = Number(structure.baseSalary) || 0;
  const hoursPerDay = Number(structure.leave?.workingHoursPerDay) || 8;

  switch (structure.type) {
    case "annual":
      return base / 12;
    case "daily":
      return base * workingDays;
    case "hourly":
      return base * hoursPerDay * workingDays;
    default:
      return base;
  }
};

/**
 * Turn a salary structure + day breakdown into Payroll fields.
 */
export const computeSalary = ({ structure, breakdown, units = {} }) => {
  const workingDays = breakdown.workingDays;
  const hoursPerDay = Number(structure.leave?.workingHoursPerDay) || 8;

  let basic = monthlyBasicOf(structure, workingDays);

  const allowances = {
    hra: 0, transport: 0, medical: 0, special: 0,
    performance: 0, overtime: 0, bonus: 0, other: 0,
  };
  const deductions = {
    pf: 0, esi: 0, tax: 0, professionalTax: 0,
    loanRecovery: 0, lopDays: 0, lopAmount: 0, other: 0,
  };

  const earnings = [];
  const deductionLines = [];
  const values = new Map();
  let earningsTotal = 0;
  let proratableEarnings = 0;
  let employerContributions = 0;

  const components = (structure.components ?? [])
    .filter((c) => c.active !== false && c.recurring !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  for (const component of components) {
    let amount = 0;

    switch (component.calculationType) {
      case "percentage": {
        let base = basic;
        if (component.percentageBase === "component") base = values.get(component.baseComponentCode) || 0;
        else if (component.percentageBase === "gross") base = basic + earningsTotal;
        else if (component.percentageBase === "ctc") base = basic + earningsTotal + employerContributions;
        amount = (base * (Number(component.percentage) || 0)) / 100;
        break;
      }
      case "per_day":
        amount = (Number(component.perDayAmount) || 0) * workingDays;
        break;
      case "per_hour":
        amount = (Number(component.perHourAmount) || 0) * hoursPerDay * workingDays;
        break;
      case "formula":
        try {
          amount = evaluateFormula(component.formula, {
            ...Object.fromEntries(values),
            BASIC: basic,
            GROSS: basic + earningsTotal,
            CTC: basic + earningsTotal + employerContributions,
            WORKING_DAYS: workingDays,
            PAID_DAYS: breakdown.paidDays ?? workingDays - (breakdown.lopDays || 0),
            LOP_DAYS: breakdown.lopDays || 0,
            HOURS_PER_DAY: hoursPerDay,
          });
        } catch {
          amount = 0; // saved before formulas were validated
        }
        break;
      case "per_unit":
        amount = (Number(component.perUnitAmount) || 0) * (Number(units[component.code]) || 0);
        break;
      default:
        amount = Number(component.amount) || 0;
    }

    amount = round2(amount);
    values.set(component.code, amount);

    if (component.type === "earning" || component.type === "reimbursement") {
      if (component.category === "basic") {
        basic += amount;
      } else {
        earnings.push({
          bucket: EARNING_BUCKET[component.category] ?? "other",
          code: component.code,
          name: component.name,
          amount,
          proratable: component.proratable !== false,
        });
        earningsTotal += amount;
      }
      if (component.proratable !== false && component.category !== "basic") {
        proratableEarnings += amount;
      }
    } else if (component.type === "deduction") {
      const bucket = DEDUCTION_BUCKET[component.category] ?? "other";
      deductions[bucket] = round2(deductions[bucket] + amount);
      deductionLines.push({ code: component.code, name: component.name, amount });
    } else if (component.type === "employer_contribution") {
      employerContributions += amount;
    }
  }

  // Proration for days outside employment (mid-month join / exit).
  const notEmployedDays = Number(breakdown.notEmployedDays) || 0;
  const employedRatio = workingDays > 0 ? (workingDays - notEmployedDays) / workingDays : 1;

  const fullBasic = round2(basic);
  const fullGross = round2(fullBasic + earningsTotal);
  basic = round2(fullBasic * employedRatio);

  const earningLines = [];
  let earnedTotal = 0;
  for (const earning of earnings) {
    const amount = earning.proratable ? round2(earning.amount * employedRatio) : earning.amount;
    allowances[earning.bucket] = round2(allowances[earning.bucket] + amount);
    earningLines.push({ code: earning.code, name: earning.name, amount });
    earnedTotal += amount;
  }

  const gross = round2(basic + earnedTotal);
  const lopDays = breakdown.lopDays || 0;
  const ratio = workingDays > 0 ? lopDays / workingDays : 0;
  const lopEnabled = structure.leave?.lossOfPayEnabled !== false;

  const perDayRate = workingDays > 0 ? round2((fullBasic + proratableEarnings) / workingDays) : 0;
  const lopAmount = lopEnabled ? round2((fullBasic + proratableEarnings) * ratio) : 0;

  deductions.lopDays = lopDays;
  deductions.lopAmount = lopAmount;

  const paidRatio = Math.max(0, employedRatio - (lopEnabled ? ratio : 0));
  const earnedBasic = fullBasic * paidRatio;
  const earnedGross = fullGross * paidRatio;

  const pf = structure.benefits?.providentFund;
  if (pf?.enabled && pf.employeePercentage > 0) {
    const base = pf.ceiling ? Math.min(earnedBasic, pf.ceiling) : earnedBasic;
    const amount = round2((base * pf.employeePercentage) / 100);
    deductions.pf = round2(deductions.pf + amount);
    deductionLines.push({ code: "PF", name: "Provident fund", amount });
  }

  const esi = structure.benefits?.esi;
  if (esi?.enabled && esi.employeePercentage > 0 && (!esi.wageCeiling || fullGross <= esi.wageCeiling)) {
    const amount = round2((earnedGross * esi.employeePercentage) / 100);
    deductions.esi = round2(deductions.esi + amount);
    deductionLines.push({ code: "ESI", name: "Employee state insurance", amount });
  }

  if (lopAmount > 0) {
    deductionLines.push({ code: "LOP", name: `Loss of pay (${lopDays} day(s))`, amount: lopAmount });
  }

  const totalDeductions = round2(
    Math.min(
      gross,
      deductions.pf + deductions.esi + deductions.tax + deductions.professionalTax +
        deductions.loanRecovery + deductions.lopAmount + deductions.other
    )
  );

  return {
    basicSalary: basic,
    allowances,
    deductions,
    grossSalary: gross,
    totalDeductions,
    netSalary: round2(Math.max(0, gross - totalDeductions)),
    perDayRate,
    lopEnabled,
    lines: {
      earnings: [{ code: "BASIC", name: "Basic", amount: basic }, ...earningLines],
      deductions: deductionLines,
    },
  };
};
