import { Payroll } from "../models/Payroll.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound, sendError } from "../utils/response.js";

export const createPayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year, basicSalary, allowances, deductions, remarks } = req.body;

  const existing = await Payroll.findOne({ employeeId, month, year });
  if (existing) return sendError(res, 400, "Payroll already exists for this period");

  const totalAllow = Object.values(allowances || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDeduct = Object.values(deductions || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const netSalary = Number(basicSalary) + totalAllow - totalDeduct;

  const payroll = await Payroll.create({
    instituteId: req.user.instituteId,
    employeeId,
    month,
    year,
    basicSalary,
    allowances,
    deductions,
    netSalary,
    status: "processed",
    processedBy: req.user._id,
    remarks,
  });

  sendCreated(res, "Payroll created", payroll);
});

export const getPayrolls = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }
  if (req.user.role === "employee") {
    query.employeeId = req.user._id;
  }
  if (req.query.employeeId) query.employeeId = req.query.employeeId;
  if (req.query.month) query.month = parseInt(req.query.month);
  if (req.query.year) query.year = parseInt(req.query.year);
  if (req.query.status) query.status = req.query.status;

  const payrolls = await Payroll.find(query)
    .populate("employeeId", "name email userCode")
    .populate("processedBy", "name")
    .sort({ year: -1, month: -1 });

  sendSuccess(res, "Payrolls fetched", payrolls);
});

export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const update = { status };
  if (status === "paid") update.paidAt = new Date();

  const payroll = await Payroll.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!payroll) return sendNotFound(res, "Payroll not found");
  sendSuccess(res, "Payroll status updated", payroll);
});

export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndDelete(req.params.id);
  if (!payroll) return sendNotFound(res, "Payroll not found");
  sendSuccess(res, "Payroll deleted");
});
