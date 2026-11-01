// server/src/validators/hrValidator.js
//
// Body schemas for /hr. hrController reads the same fields as the employee
// account endpoints (name/email/password/instituteId/profile on create,
// name/status on update), so the shared staff-account schemas are reused.

import {
  createStaffAccountSchema,
  updateStaffAccountSchema,
} from "./userValidator.js";

const createHRSchema = createStaffAccountSchema;

const updateHRSchema = updateStaffAccountSchema;

export { createHRSchema, updateHRSchema };
