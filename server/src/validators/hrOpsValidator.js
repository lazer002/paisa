// server/src/validators/hrOpsValidator.js
//
// Body schemas for HR Ops: salary structures, performance reviews,
// certificates and employee documents. Fields mirror what the controllers
// read; unknown keys pass through (see validators/common.js).

import {
  Joi,
  str,
  optStr,
  text,
  ref,
  optRef,
  num,
  optNum,
  optDate,
  optOneOf,
  strList,
  obj,
} from "./common.js";

import {
  SALARY_STATUSES,
  SALARY_TYPES,
  PAY_FREQUENCIES,
} from "../models/SalaryStructure.js";

import {
  REVIEW_STATUSES,
  REVIEW_TYPES,
} from "../models/PerformanceReview.js";

import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
} from "../models/EmployeeDocument.js";

/* ---------------- salary structures ---------------- */

const salaryFields = {
  name: str(200),
  type: optOneOf(SALARY_TYPES),
  baseSalary: num(0),
  components: Joi.array().items(obj()).max(100).allow(null),
  payFrequency: optOneOf(PAY_FREQUENCIES),
  effectiveFrom: optDate(),
  effectiveTo: optDate(),
};

export const createSalaryStructureSchema = Joi.object({
  ...salaryFields,
  name: salaryFields.name.required(),
  baseSalary: salaryFields.baseSalary.required(),
});

export const updateSalaryStructureSchema = Joi.object({
  ...salaryFields,
  status: optOneOf(SALARY_STATUSES),
});

/* ---------------- performance reviews ---------------- */

export const createReviewSchema = Joi.object({
  // Employee profile id or the person's user id (publicId or ObjectId).
  employeeId: ref().required(),
  title: str(500).required(),
  description: text(5000),
  type: optOneOf(REVIEW_TYPES),
  periodStart: optDate(),
  periodEnd: optDate(),
  dueDate: optDate(),
});

export const updateReviewSchema = Joi.object({
  title: str(500),
  description: text(5000),
  type: optOneOf(REVIEW_TYPES),
  status: optOneOf(REVIEW_STATUSES),
  overallRating: optNum(0),
  // The model stores string arrays; a single string is cast by Mongoose.
  strengths: Joi.alternatives().try(
    strList(2000, 100),
    text(2000)
  ),
  goals: Joi.array().items(obj()).max(100),
  feedback: Joi.array().items(obj()).max(200),
});

/* ---------------- certificates ---------------- */

export const createCertificateSchema = Joi.object({
  userId: ref().required(),
  title: str(500).required(),
  // Free text on purpose: the controller maps legacy/unknown values
  // ("completion", …) onto the model enum.
  type: optStr(100),
  description: text(3000),
  issuedAt: optDate(),
  issueDate: optDate(),
  expiresAt: optDate(),
  validUntil: optDate(),
  // A CertificateTemplate publicId; omitted = the organization's default.
  templateId: optRef(),
});

const templateFields = {
  heading: optStr(120),
  intro: optStr(200),
  awardLine: optStr(200),
  footerNote: optStr(300),
  signatoryName: optStr(120),
  signatoryTitle: optStr(120),
  accentColor: Joi.string().trim().pattern(/^#[0-9a-fA-F]{6}$/).messages({
    "string.pattern.base": "Colour must look like #1e3a5f",
  }),
  style: Joi.string().valid("classic", "modern"),
  isDefault: Joi.boolean(),
};

export const createCertificateTemplateSchema = Joi.object({
  name: str(120).required(),
  ...templateFields,
});

export const updateCertificateTemplateSchema = Joi.object({
  name: str(120),
  ...templateFields,
});

export const revokeCertificateSchema = Joi.object({
  reason: text(3000),
});

/* ---------------- employee documents ---------------- */

const documentFields = {
  title: str(500, 2),
  description: text(5000),
  type: optOneOf(DOCUMENT_TYPES),
  category: optStr(200),
  status: optOneOf(DOCUMENT_STATUSES),
  documentNumber: optStr(500),
  issuingAuthority: optStr(500),
  issueDate: optDate(),
  expiryDate: optDate(),
  tags: strList(100, 50),
};

export const createEmployeeDocumentSchema = Joi.object({
  ...documentFields,
  // Required for HR; self-service uploads are always filed for the caller.
  employeeUserId: optRef(),
  title: documentFields.title.required(),
  fileName: optStr(500),
  // Type/length only: the controller owns the http(s)-only rule and answers
  // 400 for other schemes (e2e-flows checks that contract).
  fileUrl: optStr(2048),
  // publicId of a file uploaded via POST /files (purpose employee_document).
  fileId: optRef(),
});

export const updateEmployeeDocumentSchema = Joi.object(documentFields);
