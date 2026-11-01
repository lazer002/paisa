// server/src/validators/employeeValidator.js
//
// Body schemas for /employees. Fields mirror what employeeController reads;
// extra keys are let through (.unknown) because the controller whitelists.

import Joi from "joi";

import {
  EXIT_STATUSES,
  LIFECYCLE_STAGES,
} from "../models/Employee.js";

import {
  createStaffAccountSchema,
  updateStaffAccountSchema,
} from "./userValidator.js";

const optionalDate = Joi.date().allow(null, "");

const createEmployeeSchema = createStaffAccountSchema;

const updateEmployeeSchema = updateStaffAccountSchema;

const changeEmployeeStageSchema = Joi.object({
  stage: Joi.string().valid(...LIFECYCLE_STAGES).required(),
  note: Joi.string().trim().max(2000).allow(null, ""),
  exitType: Joi.string().valid(...EXIT_STATUSES),
  reason: Joi.string().trim().max(3000).allow(null, ""),
  effectiveDate: optionalDate,
  lastWorkingDate: optionalDate,
  probationEndDate: optionalDate,
  deactivateUser: Joi.boolean(),
  reactivateUser: Joi.boolean(),
}).unknown(true);

const updateEmployeeChecklistSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().trim().max(100).allow(null, ""),
        label: Joi.string().trim().min(1).max(300).required(),
        phase: Joi.string().valid("onboarding", "exit").required(),
        done: Joi.boolean(),
      }).unknown(true)
    )
    .max(60)
    .required(),
}).unknown(true);

export {
  createEmployeeSchema,
  updateEmployeeSchema,
  changeEmployeeStageSchema,
  updateEmployeeChecklistSchema,
};
