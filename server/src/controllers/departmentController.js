import { Department } from "../models/Department.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendError } from "../utils/response.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, head, description } = req.body;
  if (!name) return sendError(res, 400, "Department name is required");

  const existing = await Department.findOne({ instituteId: req.user.instituteId, name });
  if (existing) return sendError(res, 400, "A department with this name already exists");

  const dept = await Department.create({
    instituteId: req.user.instituteId,
    name,
    code,
    head: head || null,
    description,
  });

  sendCreated(res, "Department created", dept);
});

export const getDepartments = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role !== "super_admin") query.instituteId = req.user.instituteId;
  if (req.query.status) query.status = req.query.status;

  const departments = await Department.find(query)
    .populate("head", "name email userCode")
    .sort({ name: 1 });

  sendSuccess(res, "Departments fetched", departments);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return sendNotFound(res, "Department not found");

  if (req.user.role !== "super_admin" && String(dept.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  const allowedFields = ["name", "code", "head", "description", "status"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await Department.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate("head", "name email");

  sendSuccess(res, "Department updated", updated);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return sendNotFound(res, "Department not found");

  if (req.user.role !== "super_admin" && String(dept.instituteId) !== String(req.user.instituteId)) {
    return sendForbidden(res, "Access denied");
  }

  await Department.findByIdAndDelete(req.params.id);
  sendSuccess(res, "Department deleted");
});
