import { User, Roles } from "../models/user.js";
import { hashPassword, resolveInstitute, scopedQuery } from "../utils/peopleHelpers.js";
import { sendSuccess, sendCreated, sendError, sendForbidden } from "../utils/response.js";

// Create Employee — admin (org-scoped) or super_admin (any org via instituteId)
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, instituteId, profile } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email and password are required");
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return sendError(res, 400, "User already exists");

    const resolvedInstitute = await resolveInstitute(req.user, instituteId);
    if (requestedButUnresolved(resolvedInstitute, instituteId)) {
      return sendError(res, 400, "Invalid instituteId");
    }

    const employee = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: Roles.EMPLOYEE,
      instituteId: resolvedInstitute,
      profile: profile || {},
    });

    const safe = employee.toObject();
    delete safe.passwordHash;

    sendCreated(res, "Employee created successfully", safe);
  } catch (err) {
    console.error("Create Employee error:", err);
    sendError(res, 500, "Server error");
  }
};

// Get all Employees — scoped: super_admin all, others their own org only
export const getEmployees = async (req, res) => {
  try {
    if (!req.user.instituteId && req.user.role !== Roles.SUPER_ADMIN) {
      return sendSuccess(res, "Employees fetched", []);
    }

    const employees = await User.find({ role: Roles.EMPLOYEE, ...scopedQuery(req.user) })
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type")
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, "Employees fetched", employees);
  } catch (err) {
    console.error("Get Employees error:", err);
    sendError(res, 500, "Server error");
  }
};

function requestedButUnresolved(resolved, requested) {
  return requested && !resolved;
}
