// server/src/validators/userValidator.js
//
// Body schemas for /users (plus the shared account/profile pieces reused by
// the employee and hr validators). Fields mirror what userController reads;
// extra keys are let through (.unknown) because the controller whitelists.

import Joi from "joi";

import { User } from "../models/User.js";
import { ROLES } from "../config/constants.js";
import { email, phone } from "../utils/validation.js";

const ROLE_VALUES = Object.values(ROLES);
const USER_STATUSES = User.schema.path("status").enumValues;

// publicIds (or legacy ObjectIds) resolved by the controller.
const ref = Joi.string().trim().min(1).max(100);

const optionalText = (max) =>
  Joi.string().trim().max(max).allow(null, "");

const optionalDate = Joi.date().allow(null, "");

const name = Joi.string().trim().min(1).max(100);

// Account passwords set by an admin (the UI enforces 8+ characters).
const accountPassword = Joi.string().min(8).max(128);

const profileSchema = Joi.object({
  phone: phone.allow(null, ""),
  alternatePhone: phone.allow(null, ""),
  address: optionalText(300),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  pincode: optionalText(20),
  avatar: optionalText(2048),
  avatarUrl: optionalText(2048),
  bio: optionalText(500),
  dateOfBirth: optionalDate,
}).unknown(true);

// Role-specific profile blocks (teacher / student / employee / hr / ...)
// are copied into the role model by the controller.
const roleData = Joi.object().unknown(true).allow(null);

const createUserSchema = Joi.object({
  name: name.required(),
  email: email.required(),
  password: accountPassword.required(),
  role: Joi.string().trim().lowercase().valid(...ROLE_VALUES).required(),
  instituteId: ref.allow(null, ""),
  profile: profileSchema.allow(null),

  teacher: roleData,
  student: roleData,
  employee: roleData,
  hr: roleData,
  principal: roleData,
  accountant: roleData,
  counselor: roleData,
  support: roleData,
  parent: roleData,
}).unknown(true);

const updateUserSchema = Joi.object({
  name,
  displayName: optionalText(100),
  status: Joi.string().valid(...USER_STATUSES),
  role: Joi.string().trim().lowercase().valid(...ROLE_VALUES),
  email,
  instituteId: ref.allow(null, ""),
  password: accountPassword.allow(""),

  profile: profileSchema,

  employment: Joi.object({
    designation: optionalText(100),
    workLocation: optionalText(200),
    workEmail: email.allow(null, ""),
    dateOfJoining: optionalDate,
    probationEndDate: optionalDate,
    skills: Joi.array().items(Joi.string().trim().max(100)).max(100),
    department: ref.allow(null, ""),
    reportingManager: ref.allow(null, ""),
  }).unknown(true),

  academic: Joi.object({
    rollNumber: optionalText(50),
    grade: optionalText(100),
    section: optionalText(50),
    guardianName: optionalText(150),
    guardianPhone: optionalText(20),
    admissionDate: optionalDate,
  }).unknown(true),
}).unknown(true);

// Shared by /employees and /hr: create an account of a fixed role.
const createStaffAccountSchema = Joi.object({
  name: name.required(),
  email: email.required(),
  password: accountPassword.required(),
  instituteId: ref.allow(null, ""),
  profile: profileSchema.allow(null),
}).unknown(true);

// Shared by /employees and /hr: the controllers only edit name + status.
const updateStaffAccountSchema = Joi.object({
  name,
  status: Joi.string().valid("active", "inactive"),
}).unknown(true);

export {
  profileSchema,
  createUserSchema,
  updateUserSchema,
  createStaffAccountSchema,
  updateStaffAccountSchema,
};
