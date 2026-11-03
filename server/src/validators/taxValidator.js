// server/src/validators/taxValidator.js
//
// Body schemas for /tax (see validators/common.js for the policy).

import { Joi } from "./common.js";

const financialYear = Joi.string().pattern(/^\d{4}-\d{2}$/).messages({
  "string.pattern.base": "financialYear looks like 2026-27",
});

const money = () => Joi.number().min(0).max(100000000);

const deductions = Joi.object({
  section80C: money(),
  section80D: money(),
  hraExemption: money(),
  homeLoanInterest: money(),
  nps80CCD1B: money(),
  other: money(),
});

export const saveDeclarationSchema = Joi.object({
  financialYear,
  regime: Joi.string().valid("new", "old"),
  deductions,
  pan: Joi.string().trim().uppercase().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).allow("", null).messages({
    "string.pattern.base": "PAN looks like ABCDE1234F",
  }),
});

export const verifyDeclarationSchema = Joi.object({
  reopen: Joi.boolean(),
});

export const estimateTaxSchema = Joi.object({
  financialYear,
  grossSalary: money().required(),
  deductions,
  employeePf: money(),
  professionalTax: money(),
});
