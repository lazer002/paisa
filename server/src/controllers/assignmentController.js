import { Assignment } from "../models/Assignment.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";

export const createAssignment = asyncHandler(async (req, res) => {
  const { classId, title, description, instructions, dueDate, maxScore, attachments } = req.body;

  const assignment = await Assignment.create({
    classId,
    instituteId: req.user.instituteId,
    createdBy: req.user._id,
    title,
    description,
    instructions,
    dueDate,
    maxScore,
    attachments,
  });

  sendCreated(res, "Assignment created", assignment);
});

export const getAssignments = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  }
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.status) query.status = req.query.status;

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
  sendSuccess(res, "Assignment fetched", assignment);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!assignment) return sendNotFound(res, "Assignment not found");
  sendSuccess(res, "Assignment updated", assignment);
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) return sendNotFound(res, "Assignment not found");
  sendSuccess(res, "Assignment deleted");
});
