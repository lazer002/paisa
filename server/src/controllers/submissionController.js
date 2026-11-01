// src/controllers/submissionController.js

import { Submission } from "../models/Submission.js";
import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";
import { User } from "../models/User.js";

import { asyncHandler } from "../utils/errorHandler.js";
import { resolveRef } from "../utils/resolveRef.js";
import { hasAnyPermission } from "../utils/permissions.js";
import { fileDownloadPath } from "../models/File.js";
import { claimFile, linkFile } from "../services/fileService.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

// Tenant filter for every non-super_admin query.
const tenantScope = (req) =>
  req.user.role === "super_admin"
    ? {}
    : { instituteId: req.user.instituteId };

// Clients send assignment publicIds; ObjectIds are still accepted.
const resolveAssignmentId = (req, reference) =>
  resolveRef(Assignment, reference, {
    label: "Assignment",
    scope: tenantScope(req),
  });

// Attachments are web links (kept as sent) or files the student uploaded
// via POST /files (purpose "submission"), which are described from the
// stored File so the client cannot fake name/size/type.
const resolveAttachments = async (
  req,
  attachments,
  submissionId
) => {
  const resolved = [];
  const files = [];

  for (const attachment of attachments || []) {
    if (!attachment?.fileId) {
      resolved.push(attachment);
      continue;
    }

    const file = await claimFile(
      req,
      attachment.fileId,
      {
        purpose: "submission",
        kind: "submission",
        resourceId: submissionId,
      }
    );

    files.push(file);

    resolved.push({
      name: file.originalName,
      url: fileDownloadPath(
        file.publicId
      ),
      fileId: file.publicId,
      sizeBytes: file.size,
      mimeType: file.mimeType,
    });
  }

  return {
    attachments: resolved,
    files,
  };
};

const linkFiles = (files, submissionId) =>
  Promise.all(
    files.map((file) =>
      linkFile(
        file,
        "submission",
        submissionId
      )
    )
  );

// Submit assignment
export const submitAssignment = asyncHandler(
  async (req, res) => {
    if (req.user.role !== "student") {
      return sendForbidden(
        res,
        "Only students can submit assignments"
      );
    }

    const {
      assignmentId,
      content,
      attachments,
    } = req.body;

    if (!assignmentId || !content) {
      return sendError(
        res,
        400,
        "assignmentId and content are required"
      );
    }

    const assignment =
      await Assignment.findOne({
        _id: await resolveAssignmentId(
          req,
          assignmentId
        ),
        ...tenantScope(req),
      });

    if (!assignment) {
      return sendNotFound(
        res,
        "Assignment not found"
      );
    }

    if (
      assignment.status !==
      "published"
    ) {
      return sendError(
        res,
        400,
        "Assignment is not open for submission"
      );
    }

    // Check student enrollment
    const cls =
      await Class.findById(
        assignment.classId
      );

    if (!cls) {
      return sendNotFound(
        res,
        "Class not found"
      );
    }

    const isEnrolled =
      cls.studentIds?.some(
        (studentId) =>
          String(studentId) ===
          String(req.user._id)
      );

    if (!isEnrolled) {
      return sendForbidden(
        res,
        "You are not enrolled in this class"
      );
    }

    const existing =
      await Submission.findOne({
        assignmentId: assignment._id,
        studentId:
          req.user._id,
      });

    if (
      existing?.status ===
      "graded"
    ) {
      return sendError(
        res,
        400,
        "This submission has already been graded"
      );
    }

    const {
      attachments: resolvedAttachments,
      files,
    } = await resolveAttachments(
      req,
      attachments,
      existing?._id
    );

    if (existing) {
      existing.content =
        content;

      existing.attachments =
        resolvedAttachments;

      existing.status =
        "submitted";

      existing.submittedAt =
        new Date();

      await existing.save();

      await linkFiles(
        files,
        existing._id
      );

      return sendSuccess(
        res,
        "Submission updated",
        existing
      );
    }

    const submission =
      await Submission.create({
        assignmentId: assignment._id,
        instituteId:
          assignment.instituteId,
        maxScore:
          assignment.maxScore ?? 100,
        studentId:
          req.user._id,
        content,
        attachments:
          resolvedAttachments,
        status: "submitted",
        submittedAt:
          new Date(),
      });

    await linkFiles(
      files,
      submission._id
    );

    sendCreated(
      res,
      "Assignment submitted",
      submission
    );
  }
);

// Get submissions
export const getSubmissions =
  asyncHandler(
    async (req, res) => {
      const query = {
        ...tenantScope(req),
      };

      const assignmentId =
        req.query.assignmentId
          ? await resolveAssignmentId(
              req,
              req.query.assignmentId
            )
          : null;

      // Students see only their own
      // submissions
      if (
        req.user.role ===
        "student"
      ) {
        query.studentId =
          req.user._id;

        if (assignmentId) {
          query.assignmentId =
            assignmentId;
        }
      }

      // Teachers see only submissions
      // belonging to their assignments
      else if (
        req.user.role ===
        "teacher"
      ) {
        if (assignmentId) {
          const assignment =
            await Assignment.findById(
              assignmentId
            );

          if (!assignment) {
            return sendNotFound(
              res,
              "Assignment not found"
            );
          }

          if (
            String(
              assignment.createdBy
            ) !==
            String(
              req.user._id
            )
          ) {
            return sendForbidden(
              res,
              "You can only view submissions for your own assignments"
            );
          }

          query.assignmentId =
            assignmentId;
        } else {
          const myAssignments =
            await Assignment.find({
              createdBy:
                req.user._id,
            }).select("_id");

          query.assignmentId = {
            $in: myAssignments.map(
              (assignment) =>
                assignment._id
            ),
          };
        }
      }

      // Admin / principal / super admin — only graders see the
      // whole institute's submissions.
      else {
        if (
          !hasAnyPermission(req.user, [
            "submission:update",
            "submission:manage",
          ])
        ) {
          return sendForbidden(
            res,
            "You cannot view these submissions"
          );
        }

        if (assignmentId) {
          query.assignmentId =
            assignmentId;
        }

        if (
          req.query.studentId
        ) {
          query.studentId =
            await resolveRef(
              User,
              req.query.studentId,
              {
                label: "Student",
                scope:
                  tenantScope(req),
              }
            );
        }
      }

      if (req.query.status) {
        query.status =
          req.query.status;
      }

      const submissions =
        await Submission.find(
          query
        )
          .populate(
            "studentId",
            "publicId name email userCode"
          )
          .populate(
            "assignmentId",
            "publicId title maxScore dueDate"
          )
          .populate(
            "gradedBy",
            "name"
          )
          .sort({
            submittedAt: -1,
          });

      sendSuccess(
        res,
        "Submissions fetched",
        submissions
      );
    }
  );

// Get single submission
export const getSubmission =
  asyncHandler(
    async (req, res) => {
      const submission =
        await Submission.findOne({
          publicId:
            req.params.publicId,
          ...tenantScope(req),
        })
          .populate(
            "studentId",
            "publicId name email userCode"
          )
          .populate(
            "assignmentId",
            "publicId title maxScore dueDate createdBy"
          )
          .populate(
            "gradedBy",
            "name"
          );

      if (!submission) {
        return sendNotFound(
          res,
          "Submission not found"
        );
      }

      // Students can only view
      // their own submission
      if (
        req.user.role ===
          "student" &&
        String(
          submission.studentId?._id ||
            submission.studentId
        ) !==
          String(
            req.user._id
          )
      ) {
        return sendForbidden(
          res,
          "Access denied"
        );
      }

      sendSuccess(
        res,
        "Submission fetched",
        submission
      );
    }
  );

// Grade submission
export const gradeSubmission =
  asyncHandler(
    async (req, res) => {
      // The route gate (submission:update) decides who may grade.
      const {
        score,
        feedback,
      } = req.body;

      if (score == null) {
        return sendError(
          res,
          400,
          "Score is required"
        );
      }

      const submission =
        await Submission.findOne({
          publicId:
            req.params.publicId,
          ...tenantScope(req),
        }).populate(
          "assignmentId",
          "maxScore createdBy"
        );

      if (!submission) {
        return sendNotFound(
          res,
          "Submission not found"
        );
      }

      // Teacher can only grade
      // their own assignments
      if (
        req.user.role ===
        "teacher"
      ) {
        if (
          String(
            submission.assignmentId
              ?.createdBy
          ) !==
          String(
            req.user._id
          )
        ) {
          return sendForbidden(
            res,
            "You can only grade submissions for your own assignments"
          );
        }
      }

      const maxScore =
        submission.assignmentId
          ?.maxScore || 100;

      if (
        !Number.isFinite(
          Number(score)
        ) ||
        Number(score) < 0
      ) {
        return sendError(
          res,
          400,
          "Score must be a non-negative number"
        );
      }

      if (
        Number(score) >
        maxScore
      ) {
        return sendError(
          res,
          400,
          `Score cannot exceed ${maxScore}`
        );
      }

      const updated =
        await Submission.findOneAndUpdate(
          {
            publicId:
              req.params.publicId,
          },
          {
            score:
              Number(score),
            maxScore,
            percentage:
              Math.round(
                (Number(score) /
                  maxScore) *
                  10000
              ) / 100,
            feedback,
            status: "graded",
            gradedAt:
              new Date(),
            gradedBy:
              req.user._id,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "studentId",
            "publicId name email userCode"
          )
          .populate(
            "assignmentId",
            "publicId title maxScore dueDate"
          )
          .populate(
            "gradedBy",
            "name"
          );

      sendSuccess(
        res,
        "Submission graded",
        updated
      );
    }
  );