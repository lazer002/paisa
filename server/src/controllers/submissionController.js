// src/controllers/submissionController.js

import { Submission } from "../models/Submission.js";
import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";

import { asyncHandler } from "../utils/errorHandler.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

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
        assignmentId,
        studentId:
          req.user._id,
      });

    if (existing) {
      if (
        existing.status ===
        "graded"
      ) {
        return sendError(
          res,
          400,
          "This submission has already been graded"
        );
      }

      existing.content =
        content;

      existing.attachments =
        attachments || [];

      existing.status =
        "submitted";

      existing.submittedAt =
        new Date();

      await existing.save();

      return sendSuccess(
        res,
        "Submission updated",
        existing
      );
    }

    const submission =
      await Submission.create({
        assignmentId,
        studentId:
          req.user._id,
        content,
        attachments:
          attachments || [],
        status: "submitted",
        submittedAt:
          new Date(),
      });

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
      const query = {};

      // Students see only their own
      // submissions
      if (
        req.user.role ===
        "student"
      ) {
        query.studentId =
          req.user._id;
      }

      // Teachers see only submissions
      // belonging to their assignments
      else if (
        req.user.role ===
        "teacher"
      ) {
        if (
          req.query.assignmentId
        ) {
          const assignment =
            await Assignment.findById(
              req.query.assignmentId
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
            req.query.assignmentId;
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

      // Admin / super admin
      else {
        if (
          req.query.assignmentId
        ) {
          query.assignmentId =
            req.query.assignmentId;
        }

        if (
          req.query.studentId
        ) {
          query.studentId =
            req.query.studentId;
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
            "name email userCode"
          )
          .populate(
            "assignmentId",
            "title maxScore dueDate"
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
        })
          .populate(
            "studentId",
            "name email userCode"
          )
          .populate(
            "assignmentId",
            "title maxScore dueDate createdBy"
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
      if (
        ![
          "super_admin",
          "admin",
          "teacher",
        ].includes(
          req.user.role
        )
      ) {
        return sendForbidden(
          res,
          "Only teachers or admins can grade submissions"
        );
      }

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
            "name email"
          )
          .populate(
            "assignmentId",
            "title maxScore dueDate"
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