// server/src/validators/organizationValidator.js
//
// Body schemas for organizations and departments. Fields mirror what the
// controllers read; unknown keys pass through (see validators/common.js).
// Field-level role rules (plan/status/type are super_admin-only) stay in
// organizationController.

import {
  Joi,
  str,
  optStr,
  text,
  optRef,
  email,
  optEmail,
  phone,
  optDate,
  oneOf,
  optOneOf,
  optObj,
} from "./common.js";

import {
  ORG_TYPES,
  ORG_STATUS,
  PLANS,
} from "../models/organization.js";

/* ---------------- organizations ---------------- */

const contactFields = {
  email: optEmail(),
  // Only used on create, as the first admin's display name.
  name: optStr(150),
  phone: phone(),
  alternatePhone: phone(),
  address: optStr(500),
  city: optStr(150),
  state: optStr(150),
  country: optStr(150),
  pincode: optStr(20),
};

const organizationFields = {
  name: str(200),
  type: oneOf(ORG_TYPES),
  description: text(5000),
  website: optStr(2048),
  logo: optStr(2048),
  meta: optObj(),
  settings: optObj(),
};

export const createOrganizationSchema = Joi.object({
  ...organizationFields,
  name: organizationFields.name.required(),
  type: organizationFields.type.required(),
  // contact.email becomes the org's first admin login.
  contact: Joi.object({
    ...contactFields,
    email: email().required(),
  }).required(),
  plan: optOneOf(PLANS),
});

export const updateOrganizationSchema = Joi.object({
  ...organizationFields,
  contact: Joi.object(contactFields).allow(null),
  status: oneOf(ORG_STATUS),
  plan: oneOf(PLANS),
  planExpiresAt: optDate(),
});

/* ---------------- departments ---------------- */

const departmentFields = {
  name: str(200),
  code: optStr(50),
  // Department head: user publicId/ObjectId, "" or null to clear.
  head: optRef(),
  description: text(500),
};

export const createDepartmentSchema = Joi.object({
  ...departmentFields,
  name: departmentFields.name.required(),
});

export const updateDepartmentSchema = Joi.object({
  ...departmentFields,
  status: oneOf(["active", "inactive"]),
});
