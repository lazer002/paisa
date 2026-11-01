// server/src/validators/studentValidator.js
//
// Body schemas for /students. Fields mirror what studentController reads;
// extra keys are let through (.unknown) because the controller whitelists.

import Joi from "joi";

import Student from "../models/student.js";

const ACADEMIC_STATUSES =
  Student.schema.path("academicStatus").enumValues;

// publicIds (or legacy ObjectIds) resolved by resolveRef in the controller.
const ref = Joi.string().trim().min(1).max(100);

const optionalText = (max) =>
  Joi.string().trim().max(max).allow(null, "");

const guardianUserIds = Joi.array()
  .items(ref)
  .max(20)
  .allow(null);

const createStudentSchema = Joi.object({
  userId: ref.required(),

  enrollmentNumber: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),

  // Student.course is required by the model.
  course: Joi.string().trim().min(1).max(200).required(),

  year: Joi.number().integer().min(1).max(10).allow(null),

  guardianUserIds,
}).unknown(true);

const updateStudentSchema = Joi.object({
  course: Joi.string().trim().min(1).max(200),
  branch: optionalText(200),
  year: Joi.number().integer().min(1).max(10).allow(null),
  semester: Joi.number().integer().min(1).max(12).allow(null),
  section: optionalText(50),
  rollNumber: optionalText(50),
  academicStatus: Joi.string().valid(...ACADEMIC_STATUSES),
  guardianUserIds,
}).unknown(true);

export { createStudentSchema, updateStudentSchema };
