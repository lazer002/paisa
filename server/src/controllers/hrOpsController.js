// server/src/controllers/hrOpsController.js
//
// HR Ops module: SalaryStructures, PerformanceReviews,
// Certificates. Complements the existing Payroll module.

import { SalaryStructure } from "../models/SalaryStructure.js";
import { PerformanceReview } from "../models/PerformanceReview.js";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";

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

import ApiError from "../utils/ApiError.js";

const ApiErrorFor = () =>
  ApiError.forbidden("Access denied", "ACCESS_DENIED");

/* =========================================================
   SALARY STRUCTURES
========================================================= */

export const createSalaryStructure = asyncHandler(
  async (req, res) => {
    const { name, type, baseSalary, components, payFrequency } =
      req.body;

    if (!name || baseSalary === undefined) {
      return sendError(
        res,
        400,
        "Name and baseSalary are required"
      );
    }

    const structure = await SalaryStructure.create({
      instituteId: req.user.instituteId,

      createdBy: req.user._id,

      name,

      type: type || "monthly",

      baseSalary: Number(baseSalary) || 0,

      components: components || [],

      payFrequency: payFrequency || "monthly",

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
      "status",
    ];

    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

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
  const { Employee } = await import(
    "../models/Employee.js"
  );

  const resolvedEmployeeId = await resolveRef(
    Employee,
    employeeId,
    { label: "Employee" }
  );

  const review = await PerformanceReview.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    employeeId: resolvedEmployeeId,

    title,

    description: description || null,

    type: type || "annual",

    periodStart: periodStart || null,
    periodEnd: periodEnd || null,
    dueDate: dueDate || null,

    status: "draft",
  });

  return sendCreated(res, {
    message: "Review created",
    data: review,
  });
});

export const getReviews = asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;

  const query = scoped(req);

  if (employeeId) {
    const { Employee } = await import(
      "../models/Employee.js"
    );

    query.employeeId = await resolveRef(
      Employee,
      employeeId,
      { label: "Employee" }
    );
  }

  if (status) query.status = status;

  const reviews = await PerformanceReview.find(query)
    .populate("employeeId", "name email userCode")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Reviews fetched",
    data: reviews,
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

  const updated =
    await PerformanceReview.findOneAndUpdate(
      { publicId: req.params.publicId },
      updates,
      { new: true, runValidators: true }
    );

  return sendSuccess(res, {
    message: "Review updated",
    data: updated,
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

export const createCertificate = asyncHandler(
  async (req, res) => {
    const {
      userId,
      title,
      type,
      issuedAt,
      expiresAt,
    } = req.body;

    if (!userId || !title) {
      return sendError(
        res,
        400,
        "userId and title are required"
      );
    }

    const resolvedUserId = await resolveRef(
      User,
      userId,
      { label: "User" }
    );

    const certificate = await Certificate.create({
      instituteId: req.user.instituteId,

      userId: resolvedUserId,

      title,

      type: type || "completion",

      issuedAt: issuedAt || new Date(),

      expiresAt: expiresAt || null,

      status: "issued",
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

    if (req.user.role === "student" || req.user.role === "employee") {
      query.userId = req.user._id;
    }

    if (userId) {
      query.userId = await resolveRef(User, userId, {
        label: "User",
      });
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

    await certificate.revoke({
      revokedBy: req.user._id,
      reason: "admin_revoked",
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
