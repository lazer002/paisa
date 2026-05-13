import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

export const createClass = asyncHandler(async (req, res) => {
  const { name, subject, description, teacherId, schedule, room, maxStudents } = req.body;
  const instituteId = req.user.instituteId;

  if (!instituteId) return sendForbidden(res, "Institute context required");
  if (!name || !subject) return sendError(res, 400, "Name and subject are required");

  const newClass = await Class.create({
    instituteId,
    name,
    subject,
    description,
    teacherId: req.user.role === "teacher" ? req.user._id : (teacherId || req.user._id),
    schedule,
    room,
    maxStudents,
  });

  sendCreated(res, "Class created successfully", newClass);
});

export const getClasses = asyncHandler(async (req, res) => {
  const { search, status, teacherId } = req.query;
  let query = {};

  if (req.user.role !== "super_admin") query.instituteId = req.user.instituteId;
  if (req.user.role === "teacher") query.teacherId = req.user._id;
  if (req.user.role === "student") query.studentIds = req.user._id;

  if (status) query.status = status;
  // Admin/super_admin can filter by teacherId; teacher cannot override theirs
  if (teacherId && req.user.role !== "teacher") query.teacherId = teacherId;
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { subject: { $regex: search, $options: "i" } },
  ];

  const classes = await Class.find(query)
    .populate("teacherId", "name email userCode")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Classes fetched", classes);
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate("teacherId", "name email userCode")
    .populate("studentIds", "name email userCode");

  if (!cls) return sendNotFound(res, "Class not found");

  // Verify requester belongs to this institute (super_admin bypasses)
  if (req.user.role !== "super_admin") {
    if (String(cls.instituteId) !== String(req.user.instituteId)) {
      return sendForbidden(res, "Access denied");
    }
  }

  // Student can only view if enrolled
  if (req.user.role === "student") {
    const enrolled = cls.studentIds?.some(s => String(s._id || s) === String(req.user._id));
    if (!enrolled) return sendForbidden(res, "You are not enrolled in this class");
  }

  sendSuccess(res, "Class fetched", cls);
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return sendNotFound(res, "Class not found");

  // Institute isolation
  if (req.user.role !== "super_admin" && String(cls.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  // Teacher can only edit their own classes
  if (req.user.role === "teacher" && String(cls.teacherId) !== String(req.user._id)) {
    return sendForbidden(res, "You can only edit your own classes");
  }

  // Prevent students from changing teacherId or instituteId
  const allowedUpdates = ["name", "subject", "description", "schedule", "room", "maxStudents", "status"];
  if (req.user.role === "admin" || req.user.role === "super_admin") allowedUpdates.push("teacherId");

  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = await Class.findByIdAndUpdate(req.params.id, updates, { new: true });
  sendSuccess(res, "Class updated", updated);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return sendNotFound(res, "Class not found");

  if (req.user.role !== "super_admin" && String(cls.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  await Class.findByIdAndDelete(req.params.id);
  sendSuccess(res, "Class deleted");
});

export const enrollStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return sendError(res, 400, "studentId is required");

  const cls = await Class.findById(req.params.id);
  if (!cls) return sendNotFound(res, "Class not found");

  if (req.user.role !== "super_admin" && String(cls.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  const updated = await Class.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { studentIds: studentId } },
    { new: true }
  ).populate("studentIds", "name email userCode");

  sendSuccess(res, "Student enrolled", updated);
});

export const removeStudent = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return sendNotFound(res, "Class not found");

  if (req.user.role !== "super_admin" && String(cls.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  const updated = await Class.findByIdAndUpdate(
    req.params.id,
    { $pull: { studentIds: req.params.studentId } },
    { new: true }
  );

  sendSuccess(res, "Student removed", updated);
});
