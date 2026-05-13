import { Department } from "../models/Department.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, head, description } = req.body;

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
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
  if (req.query.status) query.status = req.query.status;

  const departments = await Department.find(query)
    .populate("head", "name email")
    .sort({ name: 1 });

  sendSuccess(res, "Departments fetched", departments);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate("head", "name email");
  if (!dept) return sendNotFound(res, "Department not found");
  sendSuccess(res, "Department updated", dept);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) return sendNotFound(res, "Department not found");
  sendSuccess(res, "Department deleted");
});
