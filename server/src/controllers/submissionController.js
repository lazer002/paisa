import { Submission } from "../models/Submission.js";
import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

export const submitAssignment = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    return sendForbidden(res, "Only students can submit assignments");
  }

  const { assignmentId, content, attachments } = req.body;
  if (!assignmentId || !content) return sendError(res, 400, "assignmentId and content are required");

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) return sendNotFound(res, "Assignment not found");
  if (assignment.status !== "published") return sendError(res, 400, "Assignment is not open for submission");

  // Check student is enrolled in the assignment's class
  const cls = await Class.findById(assignment.classId);
  if (!cls) return sendNotFound(res, "Class not found");
  const isEnrolled = cls.studentIds?.some(s => String(s) === String(req.user._id));
  if (!isEnrolled) return sendForbidden(res, "You are not enrolled in this class");

  const existing = await Submission.findOne({ assignmentId, studentId: req.user._id });

  if (existing) {
    if (existing.status === "graded") return sendError(res, 400, "This submission has already been graded");
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

  // Students can only see their own submissions
  if (req.user.role === "student") {
    query.studentId = req.user._id;
  } else if (req.user.role === "teacher") {
    // Teacher can only see submissions for their assignments
    if (req.query.assignmentId) {
      const assignment = await Assignment.findById(req.query.assignmentId);
      if (!assignment) return sendNotFound(res, "Assignment not found");
      if (String(assignment.createdBy) !== String(req.user._id)) {
        return sendForbidden(res, "You can only view submissions for your own assignments");
      }
      query.assignmentId = req.query.assignmentId;
    } else {
      // Get all assignments by this teacher, then filter submissions
      const myAssignments = await Assignment.find({ createdBy: req.user._id }).select("_id");
      query.assignmentId = { $in: myAssignments.map(a => a._id) };
    }
  } else {
    // Admin/super_admin — apply optional filters
    if (req.query.assignmentId) query.assignmentId = req.query.assignmentId;
    if (req.query.studentId) query.studentId = req.query.studentId;
  }

  if (req.query.status) query.status = req.query.status;

  const submissions = await Submission.find(query)
    .populate("studentId", "name email userCode")
    .populate("assignmentId", "title maxScore dueDate")
    .populate("gradedBy", "name")
    .sort({ submittedAt: -1 });

  sendSuccess(res, "Submissions fetched", submissions);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  if (!["super_admin", "admin", "teacher"].includes(req.user.role)) {
    return sendForbidden(res, "Only teachers or admins can grade submissions");
  }

  const { score, feedback } = req.body;
  if (score == null) return sendError(res, 400, "Score is required");

  const submission = await Submission.findById(req.params.id)
    .populate("assignmentId", "maxScore createdBy");

  if (!submission) return sendNotFound(res, "Submission not found");

  // Teacher can only grade submissions for their own assignments
  if (req.user.role === "teacher") {
    if (String(submission.assignmentId?.createdBy) !== String(req.user._id)) {
      return sendForbidden(res, "You can only grade submissions for your own assignments");
    }
  }

  const maxScore = submission.assignmentId?.maxScore || 100;
  if (Number(score) > maxScore) return sendError(res, 400, `Score cannot exceed ${maxScore}`);

  const updated = await Submission.findByIdAndUpdate(
    req.params.id,
    { score: Number(score), feedback, status: "graded", gradedAt: new Date(), gradedBy: req.user._id },
    { new: true }
  ).populate("studentId", "name email");

  sendSuccess(res, "Submission graded", updated);
});
