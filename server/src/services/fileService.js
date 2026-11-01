// server/src/services/fileService.js
//
// Who may attach, download and delete a stored file. Download rules mirror
// how the linked records are already scoped:
//   employee_document – employee_document:create holders see every document
//                       in the org; other employee_document:read holders only
//                       documents about themselves (employeeDocumentController)
//   study_material    – teachers their own uploads; students/parents
//                       institute/public materials plus class-only ones of
//                       their (children's) classes; other roles all
//                       (studyMaterialController)
//   submission        – the student who submitted; the teacher who set the
//                       assignment (or teaches its class); graders holding
//                       submission:update/manage (submissionController)

import { File } from "../models/File.js";
import { EmployeeDocument } from "../models/EmployeeDocument.js";
import { StudyMaterial } from "../models/StudyMaterial.js";
import { Submission } from "../models/Submission.js";
import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";

import ApiError from "../utils/ApiError.js";
import { hasPermission, hasAnyPermission } from "../utils/permissions.js";
import { visibleClassIdsFor } from "../utils/parentScope.js";

const same = (a, b) => a != null && b != null && String(a) === String(b);

const isSuperAdmin = (user) => user?.role === "super_admin";

/** Permission needed to upload a file for each purpose. */
export const canUploadFor = (user, purpose) => {
  switch (purpose) {
    case "employee_document":
      // HR files for anyone; others only for themselves (controller).
      return hasAnyPermission(user, ["employee_document:create", "employee_document:read"]);
    case "study_material":
      return hasPermission(user, "study_material:create");
    case "submission":
      return user.role === "student" && hasPermission(user, "submission:create");
    case "avatar":
      return true;
    default:
      return false;
  }
};

/**
 * Loads a file the caller uploaded so it can be attached to a record.
 * `resourceId` lets a record re-attach a file already linked to it.
 */
export const claimFile = async (
  req,
  fileId,
  { purpose, kind, resourceId = null }
) => {
  if (!req.user.instituteId) {
    throw ApiError.badRequest("Institute context required");
  }

  const file = await File.findOne({
    publicId: String(fileId),
    instituteId: req.user.instituteId,
    isDeleted: false,
  });

  if (!file) {
    throw ApiError.notFound("File not found", { code: "FILE_NOT_FOUND" });
  }

  if (!same(file.uploadedBy, req.user._id)) {
    throw ApiError.forbidden("You can only attach files you uploaded", {
      code: "FILE_NOT_OWNED",
    });
  }

  if (file.purpose !== purpose) {
    throw ApiError.badRequest("This file was uploaded for something else", {
      code: "FILE_PURPOSE_MISMATCH",
    });
  }

  const linkedId = file.linkedResource?.id;

  if (
    linkedId &&
    !(file.linkedResource.kind === kind && same(linkedId, resourceId))
  ) {
    throw ApiError.conflict("This file is already attached elsewhere", {
      code: "FILE_ALREADY_LINKED",
    });
  }

  return file;
};

export const linkFile = (file, kind, resourceId) => {
  file.linkedResource = { kind, id: resourceId };
  file.visibility = "linked";
  return file.save();
};

const canSeeEmployeeDocument = async (user, file) => {
  const document = await EmployeeDocument.findOne({
    _id: file.linkedResource.id,
    instituteId: file.instituteId,
    isDeleted: { $ne: true },
  }).select("employeeUserId");

  if (!document) return false;

  if (hasPermission(user, "employee_document:create")) return true;

  return (
    hasPermission(user, "employee_document:read") &&
    same(document.employeeUserId, user._id)
  );
};

const canSeeStudyMaterial = async (user, file) => {
  const material = await StudyMaterial.findOne({
    _id: file.linkedResource.id,
    instituteId: file.instituteId,
  }).select("uploadedBy visibility classId");

  if (!material) return false;

  if (user.role === "teacher") return same(material.uploadedBy, user._id);

  const visibleClasses = await visibleClassIdsFor(user);

  if (!visibleClasses) return true;

  if (["institute", "public"].includes(material.visibility)) return true;

  return (
    material.visibility === "class_only" &&
    visibleClasses.some((classId) => same(classId, material.classId))
  );
};

const canSeeSubmission = async (user, file) => {
  const submission = await Submission.findOne({
    _id: file.linkedResource.id,
    instituteId: file.instituteId,
  }).select("studentId assignmentId");

  if (!submission) return false;

  if (user.role === "student") return same(submission.studentId, user._id);

  if (user.role === "teacher") {
    const assignment = await Assignment.findById(submission.assignmentId).select(
      "createdBy classId"
    );

    if (!assignment) return false;
    if (same(assignment.createdBy, user._id)) return true;

    const cls = await Class.findById(assignment.classId).select("teacherId");
    return same(cls?.teacherId, user._id);
  }

  return hasAnyPermission(user, ["submission:update", "submission:manage"]);
};

const LINK_CHECKS = {
  employee_document: canSeeEmployeeDocument,
  study_material: canSeeStudyMaterial,
  submission: canSeeSubmission,
};

/** Same org AND (uploader, institute-visible, or allowed on the linked record). */
export const canAccessFile = async (user, file) => {
  if (!isSuperAdmin(user) && !same(file.instituteId, user.instituteId)) {
    return false;
  }

  if (isSuperAdmin(user) || same(file.uploadedBy, user._id)) return true;

  if (file.visibility === "institute") return true;

  const check = LINK_CHECKS[file.linkedResource?.kind];

  if (!check || !file.linkedResource?.id) return false;

  return check(user, file);
};

/** Uploader, org admin, or a manager of the linked record type. */
export const canDeleteFile = (user, file) => {
  if (!isSuperAdmin(user) && !same(file.instituteId, user.instituteId)) {
    return false;
  }

  if (isSuperAdmin(user) || user.role === "admin") return true;

  if (same(file.uploadedBy, user._id)) return true;

  switch (file.linkedResource?.kind) {
    case "employee_document":
      return hasPermission(user, "employee_document:delete");
    case "study_material":
      // Teachers may only remove their own materials (= their own uploads).
      return user.role !== "teacher" && hasPermission(user, "study_material:delete");
    case "submission":
      return hasPermission(user, "submission:manage");
    default:
      return false;
  }
};
