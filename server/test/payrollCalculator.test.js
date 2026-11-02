import test from "node:test";
import assert from "node:assert/strict";

import {
  computeAttendanceBreakdown,
  computeSalary,
} from "../src/services/payrollCalculator.js";

// October 2026: 31 days, Sundays on 4, 11, 18, 25 -> 27 working days.
const OCT = { month: 10, year: 2026 };
const day = (d) => new Date(Date.UTC(2026, 9, d));

test("unmarked past working days are loss of pay", () => {
  const b = computeAttendanceBreakdown({ ...OCT, today: day(31) });
  assert.equal(b.workingDays, 27);
  assert.equal(b.unmarkedDays, 27);
  assert.equal(b.lopDays, 27);
  assert.equal(b.paidDays, 0);
});

test("future days are assumed present; unmarkedAsPresent covers the past", () => {
  const b = computeAttendanceBreakdown({ ...OCT, today: day(15) });
  assert.equal(b.unmarkedDays, 13);
  assert.equal(b.assumedPresentDays, 14);

  const all = computeAttendanceBreakdown({ ...OCT, today: day(31), unmarkedAsPresent: true });
  assert.equal(all.lopDays, 0);
  assert.equal(all.paidDays, 27);
});

test("leaves, absences and half days classify correctly", () => {
  const attendance = [];
  for (let d = 1; d <= 31; d += 1) {
    if ([5, 7, 8, 9].includes(d)) continue;
    attendance.push({ date: day(d), status: d === 6 ? "half_day" : "present" });
  }
  attendance.push({ date: day(5), status: "absent" });

  const leaves = [
    { type: "casual", startDate: day(7), endDate: day(8) },
    { type: "unpaid", startDate: day(9), endDate: day(9) },
  ];

  const b = computeAttendanceBreakdown({ ...OCT, attendance, leaves, today: day(31) });
  assert.equal(b.workingDays, 27);
  assert.equal(b.paidLeaveDays, 2);
  assert.equal(b.unpaidLeaveDays, 1);
  assert.equal(b.absentDays, 1.5);
  assert.equal(b.presentDays, 22.5);
  assert.equal(b.lopDays, 2.5);

  const s = computeSalary({
    breakdown: b,
    structure: {
      type: "monthly",
      baseSalary: 27000,
      components: [
        { code: "HRA", name: "HRA", type: "earning", category: "hra", calculationType: "percentage", percentage: 50, percentageBase: "basic" },
      ],
    },
  });

  assert.equal(s.grossSalary, 40500);
  assert.equal(s.allowances.hra, 13500);
  assert.equal(s.deductions.lopAmount, 3750);
  assert.equal(s.netSalary, 36750);
});

test("holiday attendance and custom weekly off reduce working days", () => {
  const b = computeAttendanceBreakdown({
    ...OCT,
    weeklyOff: [0, 6],
    attendance: [{ date: day(2), status: "holiday" }],
    unmarkedAsPresent: true,
    today: day(31),
  });
  // 31 - 9 weekend days (4 Sun + 5 Sat) - 1 holiday
  assert.equal(b.workingDays, 21);
});

test("mid-month joiner: days before joining are not LOP and pay is prorated", () => {
  // Joins Thu 15 Oct: working days 1-14 = 12 (Sundays 4, 11), so 15 of 27 employed.
  const b = computeAttendanceBreakdown({ ...OCT, today: day(31), unmarkedAsPresent: true, joiningDate: day(15) });
  assert.equal(b.workingDays, 27);
  assert.equal(b.notEmployedDays, 12);
  assert.equal(b.lopDays, 0);
  assert.equal(b.paidDays, 15);

  const s = computeSalary({
    breakdown: b,
    structure: {
      baseSalary: 27000,
      components: [
        { code: "HRA", name: "HRA", type: "earning", category: "hra", calculationType: "percentage", percentage: 50, percentageBase: "basic" },
        { code: "JOIN", name: "Joining bonus", type: "earning", category: "bonus", amount: 1000, proratable: false },
      ],
    },
  });

  assert.equal(s.basicSalary, 15000);
  assert.equal(s.allowances.hra, 7500);
  assert.equal(s.allowances.bonus, 1000); // not proratable
  assert.equal(s.grossSalary, 23500);
  assert.equal(s.netSalary, 23500);
});

test("leaver: days after the last working date are not paid; LOP still counts", () => {
  // Last day Sat 10 Oct: 9 working days employed (Sunday 4 is off), 18 not employed.
  const b = computeAttendanceBreakdown({
    ...OCT,
    today: day(31),
    unmarkedAsPresent: true,
    lastWorkingDate: day(10),
    leaves: [{ type: "unpaid", startDate: day(9), endDate: day(9) }],
  });
  assert.equal(b.notEmployedDays, 18);
  assert.equal(b.lopDays, 1);
  assert.equal(b.paidDays, 8);

  const s = computeSalary({ breakdown: b, structure: { baseSalary: 27000 } });
  assert.equal(s.basicSalary, 9000);
  assert.equal(s.deductions.lopAmount, 1000);
  assert.equal(s.netSalary, 8000);
});

test("formula components are evaluated in order", () => {
  const s = computeSalary({
    breakdown: { workingDays: 26, lopDays: 0, paidDays: 26 },
    structure: {
      baseSalary: 26000,
      components: [
        { code: "HRA", name: "HRA", type: "earning", category: "hra", calculationType: "formula", formula: "BASIC * 0.4", displayOrder: 1 },
        { code: "MEAL", name: "Meals", type: "earning", category: "other", calculationType: "formula", formula: "PAID_DAYS * 100", displayOrder: 2 },
        { code: "PFX", name: "PF", type: "deduction", category: "other", calculationType: "formula", formula: "min(BASIC * 0.12, 1800)", displayOrder: 3 },
        { code: "BAD", name: "Broken", type: "earning", category: "other", calculationType: "formula", formula: "BASIC *", displayOrder: 4 },
      ],
    },
  });

  assert.equal(s.allowances.hra, 10400);
  assert.equal(s.allowances.other, 2600); // meals; the broken formula counts as 0
  assert.equal(s.deductions.other, 1800);
  assert.equal(s.grossSalary, 39000);
  assert.equal(s.netSalary, 37200);
});

test("per_unit components use the run's unit count (0 when none given)", () => {
  const structure = {
    baseSalary: 20000,
    components: [
      { code: "CLASSES", name: "Extra classes", type: "earning", category: "other", calculationType: "per_unit", perUnitAmount: 500, proratable: false },
    ],
  };
  const breakdown = { workingDays: 20, lopDays: 0, paidDays: 20 };

  assert.equal(computeSalary({ structure, breakdown }).grossSalary, 20000);
  assert.equal(computeSalary({ structure, breakdown, units: { CLASSES: 6 } }).allowances.other, 3000);
});

test("PF is on earned basic; LOP can be disabled", () => {
  const breakdown = { workingDays: 20, lopDays: 5 };
  const structure = {
    baseSalary: 20000,
    benefits: { providentFund: { enabled: true, employeePercentage: 12 } },
  };

  const withLop = computeSalary({ breakdown, structure });
  assert.equal(withLop.deductions.lopAmount, 5000);
  assert.equal(withLop.deductions.pf, 1800); // 12% of 15000 earned basic
  assert.equal(withLop.netSalary, 13200);

  const noLop = computeSalary({
    breakdown,
    structure: { ...structure, leave: { lossOfPayEnabled: false } },
  });
  assert.equal(noLop.deductions.lopAmount, 0);
  assert.equal(noLop.deductions.pf, 2400);
  assert.equal(noLop.netSalary, 17600);
});
