import { StudyMaterial } from "../models/StudyMaterial.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

export const createStudyMaterial = asyncHandler(async (req, res) => {
  const { title, description, classId, subject, type, url, fileSize } = req.body;
  if (!title || !url) return sendError(res, 400, "Title and URL are required");

  const material = await StudyMaterial.create({
    instituteId: req.user.instituteId,
    classId: classId || null,
    uploadedBy: req.user._id,
    title,
    description,
    subject,
    type: type || "other",
    url,
    fileSize,
  });

  sendCreated(res, "Study material uploaded", material);
});

export const getStudyMaterials = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role !== "super_admin") query.instituteId = req.user.instituteId;

  // Teacher sees only materials they uploaded
  if (req.user.role === "teacher") query.uploadedBy = req.user._id;

  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.subject) query.subject = { $regex: req.query.subject, $options: "i" };
  if (req.query.type) query.type = req.query.type;

  const materials = await StudyMaterial.find(query)
    .populate("uploadedBy", "name")
    .populate("classId", "name subject")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Study materials fetched", materials);
});

export const updateStudyMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return sendNotFound(res, "Material not found");

  if (req.user.role !== "super_admin" && String(material.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  if (req.user.role === "teacher" && String(material.uploadedBy) !== String(req.user._id)) {
    return sendForbidden(res, "You can only edit your own materials");
  }

  const allowedFields = ["title", "description", "subject", "type", "url", "classId", "fileSize", "isPublic"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await StudyMaterial.findByIdAndUpdate(req.params.id, updates, { new: true });
  sendSuccess(res, "Material updated", updated);
});

export const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) return sendNotFound(res, "Material not found");

  if (req.user.role !== "super_admin" && String(material.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  if (req.user.role === "teacher" && String(material.uploadedBy) !== String(req.user._id)) {
    return sendForbidden(res, "You can only delete your own materials");
  }

  await StudyMaterial.findByIdAndDelete(req.params.id);
  sendSuccess(res, "Material deleted");
});
