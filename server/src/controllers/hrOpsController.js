// server/src/controllers/hrOpsController.js
//
// HR Ops module: SalaryStructures, PerformanceReviews,
// Certificates. Complements the existing Payroll module.

import { SalaryStructure } from "../models/SalaryStructure.js";
import { PerformanceReview } from "../models/PerformanceReview.js";
import crypto from "node:crypto";

import {
  Certificate,
  CERTIFICATE_TYPES,
} from "../models/Certificate.js";
import { User } from "../models/User.js";
import Organization from "../models/organization.js";
import { CertificateTemplate, designOf } from "../models/CertificateTemplate.js";
import { notifyOnce } from "../services/notify.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { hasPermission } from "../utils/permissions.js";
import { childUserIdsFor } from "../utils/parentScope.js";
import { validateFormula } from "../services/salaryFormula.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

const assertTenant = (req, row) => {
  if (
    req.user.role !== "super_admin" &&
    String(row.instituteId) !==
      String(req.user.instituteId)
  ) {
    throw ApiErrorFor();
  }

  return null;
};


const ApiErrorFor = () =>
  ApiError.forbidden("Access denied", "ACCESS_DENIED");

/* =========================================================
   SALARY STRUCTURES
========================================================= */

// The model checks formulas too, but update uses findOneAndUpdate (no
// document hooks) and a hook error would surface as a 500.
const assertValidFormulas = (components) => {
  if (!Array.isArray(components)) return;

  const codes = components.map((c) => c?.code).filter(Boolean);

  for (const component of components) {
    if (component?.calculationType !== "formula") continue;

    const problem = component.formula
      ? validateFormula(component.formula, codes)
      : "a formula is required";

    if (problem) {
      throw ApiError.badRequest(
        `Invalid formula for component ${component.code ?? component.name}: ${problem}`,
        { code: "INVALID_FORMULA" }
      );
    }
  }
};

export const createSalaryStructure = asyncHandler(
  async (req, res) => {
    const {
      name,
      type,
      baseSalary,
      components,
      payFrequency,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    if (!name || baseSalary === undefined) {
      return sendError(
        res,
        400,
        "Name and baseSalary are required"
      );
    }

    assertValidFormulas(components);

    const structure = await SalaryStructure.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      name,

      type: type || "monthly",

      baseSalary: Number(baseSalary) || 0,

      components: components || [],

      payFrequency: payFrequency || "monthly",

      // The model requires effectiveFrom; default to today.
      effectiveFrom: effectiveFrom || new Date(),

      effectiveTo: effectiveTo || null,

      status: "active",
    });

    return sendCreated(res, {
      message: "Salary structure created",
      data: structure,
    });
  }
);

export const getSalaryStructures = asyncHandler(
  async (req, res) => {
    const { status } = req.query;

    const query = scoped(req);

    if (status) query.status = status;

    const structures =
      await SalaryStructure.find(query).sort({
        createdAt: -1,
      });

    return sendSuccess(res, {
      message: "Salary structures fetched",
      data: structures,
    });
  }
);

export const updateSalaryStructure = asyncHandler(
  async (req, res) => {
    const structure = await SalaryStructure.findOne({
      publicId: req.params.publicId,
    });

    if (!structure) {
      return sendNotFound(
        res,
        "Salary structure not found"
      );
    }

    assertTenant(req, structure);

    const allowed = [
      "name",
      "type",
      "baseSalary",
      "components",
      "payFrequency",
      "effectiveFrom",
      "effectiveTo",
      "status",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    assertValidFormulas(updates.components);

    const updated =
      await SalaryStructure.findOneAndUpdate(
        { publicId: req.params.publicId },
        updates,
        { new: true, runValidators: true }
      );

    return sendSuccess(res, {
      message: "Salary structure updated",
      data: updated,
    });
  }
);

export const deleteSalaryStructure = asyncHandler(
  async (req, res) => {
    const structure = await SalaryStructure.findOne({
      publicId: req.params.publicId,
    });

    if (!structure) {
      return sendNotFound(
        res,
        "Salary structure not found"
      );
    }

    assertTenant(req, structure);

    await structure.deleteOne();

    return sendSuccess(res, {
      message: "Salary structure deleted",
      data: null,
    });
  }
);

/* =========================================================
   PERFORMANCE REVIEWS
========================================================= */

export const createReview = asyncHandler(async (req, res) => {
  const {
    employeeId,
    title,
    description,
    type,
    periodStart,
    periodEnd,
    dueDate,
  } = req.body;

  if (!employeeId || !title) {
    return sendError(
      res,
      400,
      "employeeId and title are required"
    );
  }

  // Reviews reference the Employee profile model.
  const { default: Employee } = await import(
    "../models/Employee.js"
  );

  // The UI picks people from the user list, so accept either an Employee
  // profile id or the person's user id.
  const resolvedEmployeeId = await resolveEmployeeProfile(
    Employee,
    employeeId,
    req.user.instituteId
  );

  const review = await PerformanceReview.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    employeeId: resolvedEmployeeId,

    title,

    description: description || null,

    type: type || "annual",

    // The model requires a review period; default to the current year.
    period: {
      startDate: periodStart || new Date(new Date().getFullYear(), 0, 1),
      endDate: periodEnd || new Date(new Date().getFullYear(), 11, 31),
    },
    dueDate: dueDate || null,

    status: "draft",
  });

  return sendCreated(res, {
    message: "Review created",
    data: review,
  });
});

const resolveEmployeeProfile = async (Employee, ref, instituteId) => {
  try {
    return await resolveRef(Employee, ref, { label: "Employee" });
  } catch {
    const userId = await resolveRef(User, ref, { label: "Employee" });

    const profile = await Employee.findOne({
      userId,
      instituteId,
    }).select("_id");

    if (!profile) {
      throw ApiError.notFound("That person has no employee profile yet");
    }

    return profile._id;
  }
};

export const getReviews = asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;

  const query = scoped(req);

  const { default: Employee } = await import("../models/Employee.js");

  if (employeeId) {
    query.employeeId = await resolveEmployeeProfile(
      Employee,
      employeeId,
      req.user.instituteId
    );
  }

  // People who can read reviews but not write them (employees) only see
  // reviews about themselves.
  if (!hasPermission(req.user, "performance:create")) {
    const own = await Employee.findOne({
      userId: req.user._id,
      instituteId: req.user.instituteId,
    }).select("_id");

    query.employeeId = own ? own._id : { $in: [] };
  }

  if (status) query.status = status;

  // lean(): the Employee virtuals need fields this partial populate skips.
  const reviews = await PerformanceReview.find(query)
    .populate("employeeId", "displayName workEmail employeeCode publicId")
    .sort({ createdAt: -1 })
    .lean();

  // The UI reads name/email/userCode, so present the profile that way.
  return sendSuccess(res, {
    message: "Reviews fetched",
    data: reviews.map((review) => ({
      ...review,
      employeeId: review.employeeId?.displayName
        ? {
            _id: review.employeeId._id,
            publicId: review.employeeId.publicId,
            name: review.employeeId.displayName,
            email: review.employeeId.workEmail,
            userCode: review.employeeId.employeeCode,
          }
        : review.employeeId,
    })),
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findOne({
    publicId: req.params.publicId,
  });

  if (!review) {
    return sendNotFound(res, "Review not found");
  }

  assertTenant(req, review);

  const allowed = [
    "title",
    "description",
    "type",
    "status",
    "overallRating",
    "strengths",
    "areasForImprovement",
    "outcome",
    "outcomeComments",
    "dueAt",
    "goals",
    "feedback",
  ];

  const updates = {};

  for (const field of allowed) {
    const key = field.trim();

    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (updates.goals) {
    updates.goalScore = goalScoreOf(updates.goals);
  }

  // The improvement plan (PIP) lives in performanceImprovementPlan.
  const plan = req.body.improvementPlan;
  const wasActive = review.performanceImprovementPlan?.status === "active";

  if (plan) {
    for (const [key, value] of Object.entries(plan)) {
      updates[`performanceImprovementPlan.${key}`] = value;
    }
  }

  const updated =
    await PerformanceReview.findOneAndUpdate(
      { publicId: req.params.publicId },
      updates,
      { new: true, runValidators: true }
    );

  // Tell the employee once when a plan becomes active.
  const reviewedUserId =
    !wasActive && updated.performanceImprovementPlan?.status === "active"
      ? await reviewedUserIdOf(updated)
      : null;

  if (reviewedUserId) {
    await notifyOnce({
      instituteId: updated.instituteId,
      userIds: [reviewedUserId],
      type: "system",
      title: "A performance improvement plan has started for you",
      body: `See "${updated.title}" for its objectives and dates.`,
      link: "/dashboard/hr-ops",
      reference: { kind: "pip_started", id: updated._id, publicId: updated.publicId },
    });
  }

  return sendSuccess(res, {
    message: "Review updated",
    data: updated,
  });
});

/** The login of the person a review is about (reviews point at the Employee profile). */
const reviewedUserIdOf = async (review) => {
  const { default: Employee } = await import("../models/Employee.js");
  const employee = await Employee.findById(review.employeeId).select("userId").lean();
  return employee?.userId ?? review.employeeUserId ?? null;
};

/** Weighted average goal progress (equal weights when none are set). */
export const goalScoreOf = (goals) => {
  const active = (goals ?? []).filter((g) => g.status !== "cancelled");
  if (active.length === 0) return null;

  const weights = active.map((g) => Number(g.weight) || 0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const score = totalWeight > 0
    ? active.reduce((sum, g, i) => sum + (Number(g.progress) || 0) * weights[i], 0) / totalWeight
    : active.reduce((sum, g) => sum + (Number(g.progress) || 0), 0) / active.length;

  return Math.round(score * 10) / 10;
};

// Reviews the employee may still report progress on.
const SELF_UPDATABLE_REVIEW_STATUSES = ["draft", "scheduled", "in_progress"];

/** PUT /reviews/:id/progress — the reviewed employee updates their own goals / plan objectives. */
export const updateReviewProgress = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findOne({ publicId: req.params.publicId });

  if (!review) {
    return sendNotFound(res, "Review not found");
  }

  assertTenant(req, review);

  // Only the person reviewed; others get a 404 so reviews stay private.
  if (String(await reviewedUserIdOf(review)) !== String(req.user._id)) {
    return sendNotFound(res, "Review not found");
  }

  const planActive = review.performanceImprovementPlan?.status === "active";

  if (!SELF_UPDATABLE_REVIEW_STATUSES.includes(review.status) && !planActive) {
    throw ApiError.badRequest("This review is closed for updates", "REVIEW_CLOSED");
  }

  for (const change of req.body.goals ?? []) {
    const goal = review.goals[change.index];
    if (!goal) throw ApiError.badRequest(`There is no goal #${change.index + 1}`, "GOAL_NOT_FOUND");
    if (change.progress !== undefined) goal.progress = change.progress;
    if (change.actualValue !== undefined) goal.actualValue = change.actualValue;
    if (change.status !== undefined) goal.status = change.status;
  }

  for (const change of req.body.objectives ?? []) {
    const objective = review.performanceImprovementPlan?.objectives?.[change.index];
    if (!objective) throw ApiError.badRequest(`There is no plan objective #${change.index + 1}`, "OBJECTIVE_NOT_FOUND");
    if (change.progress !== undefined) objective.progress = change.progress;
    if (change.status !== undefined) objective.status = change.status;
  }

  review.goalScore = goalScoreOf(review.goals);
  await review.save();

  return sendSuccess(res, { message: "Progress saved", data: review });
});

// The reviewed employee confirms they have seen a finished review.
const ACKNOWLEDGEABLE_REVIEW_STATUSES = ["submitted", "under_review", "completed"];

export const acknowledgeReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  if (!review) {
    return sendNotFound(res, "Review not found");
  }

  const { default: Employee } = await import("../models/Employee.js");

  const own = await Employee.findOne({
    userId: req.user._id,
    instituteId: req.user.instituteId,
  }).select("_id");

  // Only the person reviewed; others get a 404 so reviews stay private.
  if (!own || String(review.employeeId) !== String(own._id)) {
    return sendNotFound(res, "Review not found");
  }

  if (!ACKNOWLEDGEABLE_REVIEW_STATUSES.includes(review.status)) {
    return sendError(res, {
      statusCode: 400,
      code: "REVIEW_NOT_READY",
      message:
        review.status === "acknowledged"
          ? "You have already acknowledged this review"
          : "This review is not ready to acknowledge yet",
    });
  }

  review.status = "acknowledged";
  review.acknowledgedAt = new Date();
  await review.save();

  return sendSuccess(res, {
    message: "Review acknowledged",
    data: review,
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findOne({
    publicId: req.params.publicId,
  });

  if (!review) {
    return sendNotFound(res, "Review not found");
  }

  assertTenant(req, review);

  await review.deleteOne();

  return sendSuccess(res, {
    message: "Review deleted",
    data: null,
  });
});

/* =========================================================
   CERTIFICATES
========================================================= */

// Unguessable public verification code, e.g. "7F3A-91C2-0B5D-E8A4".
const newVerificationCode = () =>
  crypto
    .randomBytes(8)
    .toString("hex")
    .toUpperCase()
    .match(/.{4}/g)
    .join("-");

// Human-facing number printed on the certificate, e.g. "CRT-2026-5A1F9C0B".
const newCertificateNumber = (issueDate) =>
  `CRT-${new Date(issueDate).getFullYear()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

const certificateTypeFrom = (type) => {
  if (!type) return "course_completion";
  if (type === "completion") return "course_completion";
  return CERTIFICATE_TYPES.includes(type) ? type : "other";
};

const verificationUrlFor = (code) =>
  `${String(env.FRONTEND_URL || "").replace(/\/+$/, "")}/verify/${code}`;

export const createCertificate = asyncHandler(
  async (req, res) => {
    const {
      userId,
      title,
      type,
      description,
      issuedAt,
      issueDate,
      expiresAt,
      validUntil,
    } = req.body;

    if (!userId || !title || !String(title).trim()) {
      return sendError(
        res,
        400,
        "userId and title are required"
      );
    }

    // Recipients must belong to the issuer's organization.
    const resolvedUserId = await resolveRef(
      User,
      userId,
      {
        label: "User",
        ...(req.user.role === "super_admin"
          ? {}
          : { scope: { instituteId: req.user.instituteId } }),
      }
    );

    const recipient = await User.findById(resolvedUserId)
      .select("name email instituteId")
      .lean();

    if (!recipient?.instituteId) {
      return sendError(
        res,
        400,
        "Certificates can only be issued to organization members"
      );
    }

    const organization = await Organization.findById(
      recipient.instituteId
    )
      .select("name")
      .lean();

    const issuedOn = new Date(issueDate || issuedAt || Date.now());

    if (Number.isNaN(issuedOn.getTime())) {
      return sendError(res, 400, "Invalid issue date");
    }

    const expiry = validUntil || expiresAt || null;

    // Design: the picked template, else the organization's default, else
    // the built-in layout. Copied so later template edits don't change it.
    const template = req.body.templateId
      ? await CertificateTemplate.findOne({
          publicId: req.body.templateId,
          instituteId: recipient.instituteId,
        })
      : await CertificateTemplate.findOne({
          instituteId: recipient.instituteId,
          isDefault: true,
        });

    if (req.body.templateId && !template) {
      return sendError(res, 400, "Certificate template not found");
    }

    const certificateNumber = newCertificateNumber(issuedOn);
    const verificationCode = newVerificationCode();

    const certificate = await Certificate.create({
      instituteId: recipient.instituteId,

      userId: resolvedUserId,

      title: String(title).trim(),

      description: description || null,

      type: certificateTypeFrom(type),

      status: "issued",

      issueDate: issuedOn,

      validUntil: expiry ? new Date(expiry) : null,

      // The tenant unique indexes on these are sparse compound
      // indexes, so a missing value would collide as null.
      certificateNumber,
      certificateCode: verificationCode,
      externalId: certificateNumber,

      recipientSnapshot: {
        name: recipient.name || "Recipient",
        email: recipient.email || null,
      },

      issuer: {
        userId: req.user._id,
        name: req.user.name || null,
        organizationName: organization?.name || null,
      },

      verification: {
        status: "unverified",
        verificationCode,
        verificationUrl: verificationUrlFor(verificationCode),
      },

      history: [
        {
          action: "issued",
          fromStatus: null,
          toStatus: "issued",
          performedBy: req.user._id,
          performedAt: new Date(),
        },
      ],

      source: "manual",

      ...(template
        ? {
            template: {
              templateId: template.publicId,
              templateVersion: template.updatedAt?.toISOString() ?? null,
              name: template.name,
              configuration: designOf(template),
            },
          }
        : {}),

      createdBy: req.user._id,
    });

    return sendCreated(res, {
      message: "Certificate issued",
      data: certificate,
    });
  }
);

export const getCertificates = asyncHandler(
  async (req, res) => {
    const { status, userId } = req.query;

    const query = scoped(req);

    if (userId) {
      query.userId = await resolveRef(User, userId, {
        label: "User",
      });
    }

    // Applied after the optional filter so ?userId= cannot widen it.
    if (req.user.role === "student" || req.user.role === "employee") {
      query.userId = req.user._id;
    }

    if (req.user.role === "parent") {
      query.userId = { $in: await childUserIdsFor(req.user) };
    }

    if (status) query.status = status;

    const certificates = await Certificate.find(query)
      .populate("userId", "name email userCode")
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      message: "Certificates fetched",
      data: certificates,
    });
  }
);

export const revokeCertificate = asyncHandler(
  async (req, res) => {
    const certificate = await Certificate.findOne({
      publicId: req.params.publicId,
    });

    if (!certificate) {
      return sendNotFound(
        res,
        "Certificate not found"
      );
    }

    assertTenant(req, certificate);

    // The model's revoke() throws a plain Error (→ 500) otherwise.
    if (certificate.status !== "issued") {
      return sendError(
        res,
        400,
        "Only issued certificates can be revoked"
      );
    }

    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 3000)
        : "admin_revoked";

    await certificate.revoke({
      revokedBy: req.user._id,
      reason,
    });

    return sendSuccess(res, {
      message: "Certificate revoked",
      data: certificate,
    });
  }
);

export const deleteCertificate = asyncHandler(
  async (req, res) => {
    const certificate = await Certificate.findOne({
      publicId: req.params.publicId,
    });

    if (!certificate) {
      return sendNotFound(
        res,
        "Certificate not found"
      );
    }

    assertTenant(req, certificate);

    await certificate.deleteOne();

    return sendSuccess(res, {
      message: "Certificate deleted",
      data: null,
    });
  }
);
