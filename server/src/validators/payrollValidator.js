// server/src/validators/payrollValidator.js
//
// Body schemas for /api/payroll writes. Field lists mirror what
// payrollController reads; unknown keys are allowed (and passed through)
// so existing clients keep working.

import Joi from "joi";

import { bodyValidator } from "./leaveValidator.js";

const PAYMENT_METHODS = ["bank_transfer", "cheque", "cash", "upi"];

const publicRef = Joi.string().trim().max(100);

const month = Joi.number().integer().min(1).max(12);

const year = Joi.number().integer().min(2000).max(2200);

// { hra: 5000, da: 1200, ... } — component name -> non-negative amount.
const amounts = Joi.object()
  .pattern(Joi.string(), Joi.number().min(0).allow(null))
  .allow(null);

export const createPayrollSchema = Joi.object({
  employeeId: publicRef.required(),
  month: month.required(),
  year: year.required(),
  basicSalary: Joi.number().greater(0).required(),
  allowances: amounts,
  deductions: amounts,
  remarks: Joi.string().trim().max(500).allow(null, ""),
});

export const payrollStatusSchema = Joi.object({
  status: Joi.string().valid("draft", "processed", "paid").required(),
  method: Joi.string().valid(...PAYMENT_METHODS).allow(null, ""),
  referenceNo: Joi.string().trim().max(150).allow(null, ""),
});

export const generatePayrollSchema = Joi.object({
  month: month.required(),
  year: year.required(),
  // Array of weekdays (0 = Sunday) or the comma list the query form uses.
  weeklyOff: Joi.alternatives()
    .try(
      Joi.array().items(Joi.number().integer().min(0).max(6)),
      Joi.string().trim().pattern(/^[0-6](\s*,\s*[0-6])*$/).allow("")
    )
    .allow(null),
  unmarkedAsPresent: Joi.boolean().truthy(1, "1").falsy(0, "0").allow(null),
});

export const assignSalaryStructureSchema = Joi.object({
  // null / empty removes the assignment.
  salaryStructureId: publicRef.allow(null, ""),
});

export const validateCreatePayroll = bodyValidator(createPayrollSchema);
export const validatePayrollStatus = bodyValidator(payrollStatusSchema);
export const validateGeneratePayroll = bodyValidator(generatePayrollSchema);
export const validateAssignSalaryStructure = bodyValidator(
  assignSalaryStructureSchema
);
