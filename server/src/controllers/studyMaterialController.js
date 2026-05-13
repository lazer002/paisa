import { StudyMaterial } from "../models/StudyMaterial.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";

export const createStudyMaterial = asyncHandler(async (req, res) => {
  const { title, description, classId, subject, type, url, fileSize } = req.body;

  const material = await StudyMaterial.create({
    instituteId: req.user.instituteId,
    classId: classId || null,
    uploadedBy: req.user._id,
    title,
    description,
    subject,
    type,
    url,
    fileSize,
  });

  sendCreated(res, "Study material uploaded", material);
});

export const getStudyMaterials = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
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
  const material = await StudyMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!material) return sendNotFound(res, "Material not found");
  sendSuccess(res, "Material updated", material);
});

export const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findByIdAndDelete(req.params.id);
  if (!material) return sendNotFound(res, "Material not found");
  sendSuccess(res, "Material deleted");
});
