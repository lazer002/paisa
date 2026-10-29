// server/src/controllers/employeeDocumentController.js
//
// HR document records (contracts, ID proofs, certificates...) for
// employees. HR/admin manage every record in the institute; other roles
// that hold employee_document:read only see documents about themselves.

import Employee from "../models/Employee.js";
import { User } from "../models/User.js";
import { EmployeeDocument } from "../models/EmployeeDocument.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import ApiError from "../utils/ApiError.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from "../utils/response.js";

import {
  pickFields,
  tenantScope,
  escapeRegex,
  requireInstitute,
} from "../utils/crudHelpers.js";

import { hasPermission } from "../utils/permissions.js";

const WRITABLE = [
  "title",
  "description",
  "type",
  "category",
  "status",
  "documentNumber",
  "issuingAuthority",
  "issueDate",
  "expiryDate",
  "tags",
];

const canManage = (user) =>
  hasPermission(user, "employee_document:create");

export const createEmployeeDocument = asyncHandler(
  async (req, res) => {
    const instituteId = requireInstitute(req);

    // The client picks a person by user publicId; documents hang off
    // that person's Employee profile.
    const userId = await resolveRef(
      User,
      req.body.employeeUserId,
      { label: "Employee" }
    );

    const employee = await Employee.findOne({
      userId,
      instituteId,
    }).select("userId departmentId");

    if (!employee) {
      return sendNotFound(
        res,
        "That person has no employee profile yet"
      );
    }

    const { fileName, fileUrl } = req.body;

    // The link is rendered as <a href> in the UI, so only plain web
    // links are accepted (no javascript: / data: URLs).
    if (fileUrl) {
      let protocol = null;

      try {
        protocol = new URL(fileUrl).protocol;
      } catch {
        protocol = null;
      }

      if (!["http:", "https:"].includes(protocol)) {
        throw ApiError.badRequest("File link must be an http(s) URL");
      }
    }

    const document = await EmployeeDocument.create({
      ...pickFields(req.body, WRITABLE),
      instituteId,
      employeeId: employee._id,
      employeeUserId: employee.userId,
      departmentId: employee.departmentId ?? undefined,
      // A document without a stored file is just a checklist entry.
      versions:
        fileName && fileUrl
          ? [{ version: 1, fileName, fileUrl }]
          : [],
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      createdBy: req.user._id,
    });

    return sendCreated(res, {
      message: "Employee document created",
      data: document,
    });
  }
);

export const getEmployeeDocuments = asyncHandler(
  async (req, res) => {
    const { type, status, search } = req.query;

    const query = tenantScope(req);

    if (!canManage(req.user)) {
      query.employeeUserId = req.user._id;
    }

    if (type) query.type = String(type);
    if (status) query.status = String(status);

    if (search) {
      query.title = {
        $regex: escapeRegex(search),
        $options: "i",
      };
    }

    const documents = await EmployeeDocument.find(query)
      .populate("employeeUserId", "name email userCode")
      .sort({ createdAt: -1 })
      .limit(200);

    return sendSuccess(res, {
      message: "Employee documents fetched",
      data: documents,
    });
  }
);

export const updateEmployeeDocument = asyncHandler(
  async (req, res) => {
    const document = await EmployeeDocument.findOne(
      tenantScope(req, { publicId: req.params.publicId })
    );

    if (!document) {
      return sendNotFound(res, "Employee document not found");
    }

    Object.assign(document, pickFields(req.body, WRITABLE), {
      updatedBy: req.user._id,
    });

    await document.save();

    return sendSuccess(res, {
      message: "Employee document updated",
      data: document,
    });
  }
);

export const deleteEmployeeDocument = asyncHandler(
  async (req, res) => {
    const document = await EmployeeDocument.findOne(
      tenantScope(req, { publicId: req.params.publicId })
    );

    if (!document) {
      return sendNotFound(res, "Employee document not found");
    }

    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deletedBy = req.user._id;
    await document.save();

    return sendSuccess(res, {
      message: "Employee document deleted",
    });
  }
);
