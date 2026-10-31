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
