import { Assignment } from "../models/Assignment.js";
import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

export const createAssignment = asyncHandler(async (req, res) => {
  const { classId, title, description, instructions, dueDate, maxScore, attachments } = req.body;

  if (!classId || !title) return sendError(res, 400, "classId and title are required");

  // Teacher can only create assignments for their own classes
  if (req.user.role === "teacher") {
    const cls = await Class.findById(classId);
    if (!cls) return sendNotFound(res, "Class not found");
    if (String(cls.teacherId) !== String(req.user._id)) {
      return sendForbidden(res, "You can only create assignments for your own classes");
    }
  }

  const assignment = await Assignment.create({
    classId,
    instituteId: req.user.instituteId,
    createdBy: req.user._id,
    title,
    description,
    instructions,
    dueDate,
    maxScore: maxScore || 100,
    attachments,
    status: "published",
  });

  sendCreated(res, "Assignment created", assignment);
});

export const getAssignments = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role !== "super_admin") query.instituteId = req.user.instituteId;
  if (req.user.role === "teacher") query.createdBy = req.user._id;

  // Students only see published assignments for their enrolled classes
  if (req.user.role === "student") {
    const enrolledClasses = await Class.find({ studentIds: req.user._id }).select("_id");
    const classIds = enrolledClasses.map(c => c._id);
    query.classId = { $in: classIds };
    query.status = "published";
  }

  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.status && req.user.role !== "student") query.status = req.query.status;

  const assignments = await Assignment.find(query)
    .populate("classId", "name subject")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Assignments fetched", assignments);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("classId", "name subject")
    .populate("createdBy", "name email");

  if (!assignment) return sendNotFound(res, "Assignment not found");

  if (req.user.role !== "super_admin" && String(assignment.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  sendSuccess(res, "Assignment fetched", assignment);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return sendNotFound(res, "Assignment not found");

  if (req.user.role !== "super_admin" && String(assignment.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  // Teacher can only edit their own assignments
  if (req.user.role === "teacher" && String(assignment.createdBy) !== String(req.user._id)) {
    return sendForbidden(res, "You can only edit your own assignments");
  }

  const allowedFields = ["title", "description", "instructions", "dueDate", "maxScore", "status", "attachments"];
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true });
  sendSuccess(res, "Assignment updated", updated);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return sendNotFound(res, "Assignment not found");

  if (req.user.role !== "super_admin" && String(assignment.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  if (req.user.role === "teacher" && String(assignment.createdBy) !== String(req.user._id)) {
    return sendForbidden(res, "You can only delete your own assignments");
  }

  await Assignment.findByIdAndDelete(req.params.id);
  sendSuccess(res, "Assignment deleted");
});
