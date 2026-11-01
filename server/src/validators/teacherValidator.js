// server/src/validators/teacherValidator.js
//
// Body schema for POST /teachers. Mirrors what teacherController reads;
// extra keys are let through (.unknown) because the controller whitelists.

import Joi from "joi";

const ref = Joi.string().trim().min(1).max(100);

const qualification = Joi.object({
  degree: Joi.string().trim().min(1).max(150).required(),
  institution: Joi.string().trim().max(200).allow(null, ""),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
}).unknown(true);

const createTeacherSchema = Joi.object({
  userId: ref.required(),

  // Only honoured for super_admin; others must match their own org.
  instituteId: ref.allow(null, ""),

  subject: Joi.string().trim().max(100).allow(null, ""),

  // The Teachers page sends free text; the model stores structured entries.
  qualifications: Joi.alternatives().try(
    Joi.string().trim().max(500).allow(""),
    Joi.array().items(qualification).max(20)
  ).allow(null),

  experience: Joi.number().min(0).max(60).allow(null),
}).unknown(true);

export { createTeacherSchema };
