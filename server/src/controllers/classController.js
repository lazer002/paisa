import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden } from "../utils/response.js";

export const createClass = asyncHandler(async (req, res) => {
  const { name, subject, description, teacherId, schedule, room, maxStudents } = req.body;
  const instituteId = req.user.instituteId;

  if (!instituteId) return sendForbidden(res, "Institute context required");

  const newClass = await Class.create({
    instituteId,
    name,
    subject,
    description,
    teacherId: teacherId || req.user._id,
    schedule,
    room,
    maxStudents,
  });

  sendCreated(res, "Class created successfully", newClass);
});

export const getClasses = asyncHandler(async (req, res) => {
  const { search, status, teacherId } = req.query;
  let query = {};

  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
  if (req.user.role === "teacher") {
    query.teacherId = req.user._id;
  }
  if (req.user.role === "student") {
    query.studentIds = req.user._id;
  }
  if (status) query.status = status;
  if (teacherId) query.teacherId = teacherId;
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { subject: { $regex: search, $options: "i" } },
  ];

  const classes = await Class.find(query)
    .populate("teacherId", "name email")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Classes fetched", classes);
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate("teacherId", "name email")
    .populate("studentIds", "name email userCode");

  if (!cls) return sendNotFound(res, "Class not found");
  sendSuccess(res, "Class fetched", cls);
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cls) return sendNotFound(res, "Class not found");
  sendSuccess(res, "Class updated", cls);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndDelete(req.params.id);
  if (!cls) return sendNotFound(res, "Class not found");
  sendSuccess(res, "Class deleted");
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const cls = await Class.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { studentIds: studentId } },
    { new: true }
  ).populate("studentIds", "name email userCode");
  if (!cls) return sendNotFound(res, "Class not found");
  sendSuccess(res, "Student enrolled", cls);
});

export const removeStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(
    req.params.id,
    { $pull: { studentIds: req.params.studentId } },
    { new: true }
  );
  if (!cls) return sendNotFound(res, "Class not found");
  sendSuccess(res, "Student removed", cls);
});
