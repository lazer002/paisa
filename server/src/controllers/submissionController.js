import { Submission } from "../models/Submission.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendError } from "../utils/response.js";

export const submitAssignment = asyncHandler(async (req, res) => {
  const { assignmentId, content, attachments } = req.body;

  const existing = await Submission.findOne({ assignmentId, studentId: req.user._id });
  if (existing) {
    existing.content = content;
    existing.attachments = attachments || [];
    existing.status = "submitted";
    existing.submittedAt = new Date();
    await existing.save();
    return sendSuccess(res, "Submission updated", existing);
  }

  const submission = await Submission.create({
    assignmentId,
    studentId: req.user._id,
    content,
    attachments: attachments || [],
    status: "submitted",
    submittedAt: new Date(),
  });

  sendCreated(res, "Assignment submitted", submission);
});

export const getSubmissions = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === "student") {
    query.studentId = req.user._id;
  }
  if (req.query.assignmentId) query.assignmentId = req.query.assignmentId;
  if (req.query.studentId) query.studentId = req.query.studentId;
  if (req.query.status) query.status = req.query.status;

  const submissions = await Submission.find(query)
    .populate("studentId", "name email userCode")
    .populate("assignmentId", "title maxScore dueDate")
    .populate("gradedBy", "name")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Submissions fetched", submissions);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;
  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    {
      score,
      feedback,
      status: "graded",
      gradedAt: new Date(),
      gradedBy: req.user._id,
    },
    { new: true }
  ).populate("studentId", "name email");
  if (!submission) return sendNotFound(res, "Submission not found");
  sendSuccess(res, "Submission graded", submission);
});
