// server/src/controllers/taxController.js
//
// /api/tax — income-tax declarations and annual statements.
// Everyone with payroll:read manages their own declaration and sees their own
// statement; payroll managers (payroll:create|update|manage) and finance
// (finance:read) see the organization's; payroll:update|manage verify.

import { User } from "../models/User.js";
import Organization from "../models/organization.js";
import { TaxDeclaration } from "../models/TaxDeclaration.js";
import { annualStatement, payrollsForYear } from "../services/taxService.js";
import { financialYearOf, compareRegimes } from "../services/incomeTax.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { hasAnyPermission } from "../utils/permissions.js";
import { resolveRef } from "../utils/resolveRef.js";
import { sendSuccess } from "../utils/response.js";

const VIEW_OTHERS = ["payroll:create", "payroll:update", "payroll:manage", "finance:read"];
const VERIFY = ["payroll:update", "payroll:manage"];

const FY = /^\d{4}-\d{2}$/;

const yearFrom = (value) => {
  const fy = value ? String(value) : financialYearOf();
  if (!FY.test(fy)) throw ApiError.badRequest("financialYear looks like 2026-27", "INVALID_FINANCIAL_YEAR");
  return fy;
};

/** The person the request is about: yourself, or (managers) any member of your organization. */
const targetUser = async (req, ref) => {
  if (!ref || ref === req.user.publicId) {
    return User.findById(req.user._id).select("_id publicId name userCode instituteId role").lean();
  }

  if (!hasAnyPermission(req.user, VIEW_OTHERS)) {
    throw ApiError.forbidden("You can only see your own tax details", "ACCESS_DENIED");
  }

  const id = await resolveRef(User, ref, { label: "User", scope: { instituteId: req.user.instituteId } });
  return User.findById(id).select("_id publicId name userCode instituteId role").lean();
};

const declarationView = (d) =>
  d && {
    publicId: d.publicId,
    financialYear: d.financialYear,
    regime: d.regime,
    deductions: d.deductions,
    pan: d.pan,
    status: d.status,
    verifiedAt: d.verifiedAt,
    updatedAt: d.updatedAt,
  };

export const getDeclaration = asyncHandler(async (req, res) => {
  const financialYear = yearFrom(req.query.financialYear);
  const user = await targetUser(req, req.query.userId);
  const declaration = await TaxDeclaration.findOne({ userId: user._id, instituteId: user.instituteId, financialYear }).lean();

  return sendSuccess(res, {
    message: "Tax declaration",
    data: declarationView(declaration) ?? { financialYear, regime: "new", deductions: {}, pan: null, status: null },
  });
});

/** Own declaration; a verified one is locked. */
export const saveDeclaration = asyncHandler(async (req, res) => {
  const financialYear = yearFrom(req.body.financialYear);

  if (!req.user.instituteId) {
    throw ApiError.badRequest("Tax declarations belong to an organization", "ORGANIZATION_REQUIRED");
  }

  const filter = { userId: req.user._id, instituteId: req.user.instituteId, financialYear };
  const existing = await TaxDeclaration.findOne(filter);

  if (existing?.status === "verified") {
    throw ApiError.badRequest("Your declaration was verified by HR and is locked. Ask HR to reopen it", "DECLARATION_LOCKED");
  }

  const declaration = existing ?? new TaxDeclaration(filter);
  if (req.body.regime !== undefined) declaration.regime = req.body.regime;
  if (req.body.pan !== undefined) declaration.pan = req.body.pan || null;
  if (req.body.deductions) {
    for (const [key, value] of Object.entries(req.body.deductions)) {
      declaration.deductions[key] = Number(value) || 0;
    }
  }
  declaration.status = "submitted";

  await declaration.save();

  return sendSuccess(res, { message: "Tax declaration saved", data: declarationView(declaration) });
});

/** Managers: everyone's declarations for a year. */
export const listDeclarations = asyncHandler(async (req, res) => {
  const financialYear = yearFrom(req.query.financialYear);

  const rows = await TaxDeclaration.find({ instituteId: req.user.instituteId, financialYear })
    .populate("userId", "publicId name userCode role")
    .sort({ updatedAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Tax declarations",
    data: rows.map((d) => ({ ...declarationView(d), user: d.userId })),
  });
});

/** Managers: verify (locks it) or reopen a declaration. */
export const verifyDeclaration = asyncHandler(async (req, res) => {
  const declaration = await TaxDeclaration.findOne({ publicId: req.params.publicId, instituteId: req.user.instituteId });

  if (!declaration) throw ApiError.notFound("Declaration not found", "DECLARATION_NOT_FOUND");

  const reopen = req.body?.reopen === true;
  declaration.status = reopen ? "submitted" : "verified";
  declaration.verifiedBy = reopen ? null : req.user._id;
  declaration.verifiedAt = reopen ? null : new Date();
  await declaration.save();

  return sendSuccess(res, { message: reopen ? "Declaration reopened" : "Declaration verified", data: declarationView(declaration) });
});

/** The annual tax statement (Form 16 style). */
export const getStatement = asyncHandler(async (req, res) => {
  const financialYear = yearFrom(req.query.financialYear);
  const user = await targetUser(req, req.query.userId);
  const organization = await Organization.findById(user.instituteId).select("name").lean();

  return sendSuccess(res, {
    message: "Annual tax statement",
    data: await annualStatement({ user, organizationName: organization?.name, financialYear }),
  });
});

/** Old vs new regime for an annual salary the person types in (planning tool). */
export const estimateTax = asyncHandler(async (req, res) => {
  const financialYear = yearFrom(req.body.financialYear);
  const grossSalary = Number(req.body.grossSalary);

  if (!(grossSalary >= 0)) throw ApiError.badRequest("grossSalary is required", "GROSS_REQUIRED");

  const rows = await payrollsForYear({ userId: req.user._id, instituteId: req.user.instituteId, financialYear });
  const pf = rows.reduce((s, p) => s + (p.deductions?.pf || 0), 0);

  return sendSuccess(res, {
    message: "Tax estimate",
    data: compareRegimes({
      grossSalary,
      declared: req.body.deductions ?? {},
      employeePf: Number(req.body.employeePf ?? pf) || 0,
      professionalTax: Number(req.body.professionalTax) || 0,
      financialYear,
    }),
  });
});

export const TAX_PERMISSIONS = { VIEW_OTHERS, VERIFY };
