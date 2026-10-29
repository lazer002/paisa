// server/src/controllers/auditController.js
//
// Read-only audit trail. Rows are written by middleware/audit.js.

import { AuditLog } from "../models/AuditLog.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { sendSuccess } from "../utils/response.js";

const MAX_PAGE_SIZE = 100;

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, category, search } = req.query;

  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 50, 1),
    MAX_PAGE_SIZE
  );

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const query = {};

  // Only the platform owner sees across tenants.
  if (req.user.role !== "super_admin") {
    query.instituteId = req.user.instituteId;
  }

  if (action) query.action = String(action);
  if (category) query.category = String(category);

  if (search) {
    const pattern = {
      $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };

    query.$or = [
      { description: pattern },
      { email: pattern },
      { name: pattern },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .select(
        "action category description name email role resourceType createdAt request.method request.route request.statusCode request.ipAddress"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Audit logs fetched",
    data: logs,
    meta: { page, limit, total },
  });
});
