// server/src/controllers/crmActivityController.js
//
// CRM activities (calls, emails, meetings...), tasks and notes, attached to
// a lead / deal / contact / customer. Tenant-scoped, soft-deleted,
// whitelisted fields only.
//
// Notes are stored as CRMActivity documents with type "note" (there is no
// separate note model). The /crm-notes routes are gated by crm_note:* and
// the /crm-activities routes never touch notes.

import { CRMActivity } from "../models/CRMActivity.js";
import { CRMTask } from "../models/CRMTask.js";
import { Lead } from "../models/Lead.js";
import { Deal } from "../models/Deal.js";
import { rescoreLead } from "../services/leadScoring.js";
import { Contact } from "../models/Contact.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";

import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";
import { resolveRef } from "../utils/resolveRef.js";
import { hasAnyPermission } from "../utils/permissions.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from "../utils/response.js";

import {
  pickFields,
  tenantScope,
  escapeRegex,
  requireInstitute,
} from "../utils/crudHelpers.js";

/* ============================================================================
 * SHARED
 * ========================================================================== */

// Body/query key -> model used to resolve the publicId.
const PARENT_REFS = [
  { key: "leadId", Model: Lead, label: "Lead" },
  { key: "dealId", Model: Deal, label: "Deal" },
  { key: "contactId", Model: Contact, label: "Contact" },
  { key: "customerId", Model: Customer, label: "Customer" },
];

const USER_FIELDS = "publicId name email role";

// lean: the referenced models define virtuals over fields we do not select
// (e.g. Contact), which throw when a partial document is serialized.
const POPULATE = [
  { path: "leadId", select: "publicId firstName lastName fullName companyName" },
  { path: "dealId", select: "publicId title" },
  { path: "contactId", select: "publicId fullName displayName" },
  { path: "customerId", select: "publicId displayName" },
  { path: "ownerId", select: USER_FIELDS },
  { path: "createdBy", select: USER_FIELDS },
  { path: "completedBy", select: USER_FIELDS },
].map((entry) => ({ ...entry, options: { lean: true } }));

const refScope = (req) =>
  req.user.role === "super_admin"
    ? {}
    : { instituteId: req.user.instituteId };

/** Resolve lead/deal/contact/customer publicIds present in `source`. */
const resolveParents = async (req, source) => {
  const resolved = {};

  for (const { key, Model, label } of PARENT_REFS) {
    if (source?.[key] === undefined) continue;

    resolved[key] = await resolveRef(Model, source[key], {
      label,
      scope: refScope(req),
    });
  }

  return resolved;
};

const resolveUser = (req, ref) =>
  resolveRef(User, ref, {
    label: "Assignee",
    scope: refScope(req),
  });

const userPermissions = (req) =>
  req.auth?.permissions ?? req.user?.permissions ?? [];

/**
 * Roles with <resource>:delete / :manage may delete any record; roles that
 * only create (counselor) may delete the records they created.
 */
const assertCanDelete = (req, doc, resource) => {
  if (
    hasAnyPermission(
      req.user,
      [`${resource}:delete`, `${resource}:manage`],
      userPermissions(req)
    )
  ) {
    return;
  }

  if (String(doc.createdBy?._id ?? doc.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only delete records you created");
  }
};

// Editing follows the same rule as deleting: managers any record, everyone
// else only the records they created.
const assertCanEdit = (req, doc, resource) => {
  if (hasAnyPermission(req.user, [`${resource}:manage`], userPermissions(req))) {
    return;
  }

  if (String(doc.createdBy?._id ?? doc.createdBy) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only edit records you created");
  }
};

const softDelete = async (doc, req) => {
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.updatedBy = req.user._id;
  await doc.save();
};

const listLimit = (req) =>
  Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);

/* ============================================================================
 * ACTIVITIES
 * ========================================================================== */

const ACTIVITY_WRITABLE = [
  "type",
  "status",
  "priority",
  "subject",
  "description",
  "outcome",
  "outcomeNotes",
  "channel",
  "scheduledAt",
  "completedAt",
  "dueAt",
  "durationMinutes",
  "tags",
];

const notNote = { type: { $ne: "note" } };

const assertNotNoteType = (type) => {
  if (type === "note") {
    throw ApiError.badRequest("Use /crm-notes for notes");
  }
};

export const createActivity = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, ACTIVITY_WRITABLE);
  assertNotNoteType(data.type);

  const activity = await CRMActivity.create({
    ...data,
    ...(await resolveParents(req, req.body)),
    instituteId: requireInstitute(req),
    ownerId: req.user._id,
    createdBy: req.user._id,
    completedBy: data.status === "completed" ? req.user._id : null,
  });

  await touchLead(activity.leadId);
  await activity.populate(POPULATE);

  return sendCreated(res, {
    message: "Activity created",
    data: activity,
  });
});

/** An interaction with a lead: note when it happened and rescore it. */
const touchLead = async (leadId) => {
  if (!leadId) return;
  await Lead.updateOne({ _id: leadId }, { $set: { lastActivityAt: new Date() } });
  await rescoreLead(leadId);
};

export const getActivities = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;

  const query = tenantScope(req, {
    ...notNote,
    ...(await resolveParents(req, req.query)),
  });

  if (type && type !== "note") query.type = String(type);
  if (status) query.status = String(status);
  if (req.query.mine === "true") query.ownerId = req.user._id;

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ subject: pattern }, { description: pattern }];
  }

  const activities = await CRMActivity.find(query)
    .populate(POPULATE)
    .sort({ createdAt: -1 })
    .limit(listLimit(req));

  return sendSuccess(res, {
    message: "Activities fetched",
    data: activities,
  });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await CRMActivity.findOne(
    tenantScope(req, { publicId: req.params.publicId, ...notNote })
  );

  if (!activity) {
    return sendNotFound(res, "Activity not found");
  }

  assertCanEdit(req, activity, "crm_activity");

  const data = pickFields(req.body, ACTIVITY_WRITABLE);
  assertNotNoteType(data.type);

  Object.assign(activity, data, await resolveParents(req, req.body), {
    updatedBy: req.user._id,
  });

  if (data.status === "completed" && !activity.completedBy) {
    activity.completedBy = req.user._id;
  }

  await activity.save();
  await activity.populate(POPULATE);

  return sendSuccess(res, {
    message: "Activity updated",
    data: activity,
  });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await CRMActivity.findOne(
    tenantScope(req, { publicId: req.params.publicId, ...notNote })
  );

  if (!activity) {
    return sendNotFound(res, "Activity not found");
  }

  assertCanDelete(req, activity, "crm_activity");
  await softDelete(activity, req);

  return sendSuccess(res, { message: "Activity deleted" });
});

/* ============================================================================
 * NOTES (CRMActivity with type "note")
 * ========================================================================== */

const noteFields = (body) => {
  const data = {};

  if (body?.body !== undefined) {
    data.description = String(body.body ?? "").trim() || null;
  }

  if (body?.title !== undefined) {
    data.subject = String(body.title ?? "").trim();
  }

  if (!data.subject && data.description) {
    data.subject =
      data.description.length > 120
        ? `${data.description.slice(0, 117)}...`
        : data.description;
  }

  if (data.subject === "") delete data.subject;

  return data;
};

export const createNote = asyncHandler(async (req, res) => {
  const data = noteFields(req.body);

  if (!data.description && !data.subject) {
    throw ApiError.badRequest("Note text is required");
  }

  const note = await CRMActivity.create({
    ...data,
    ...(await resolveParents(req, req.body)),
    type: "note",
    status: "completed",
    channel: "system",
    instituteId: requireInstitute(req),
    ownerId: req.user._id,
    createdBy: req.user._id,
    completedBy: req.user._id,
  });

  await touchLead(note.leadId);
  await note.populate(POPULATE);

  return sendCreated(res, {
    message: "Note added",
    data: note,
  });
});

export const getNotes = asyncHandler(async (req, res) => {
  const query = tenantScope(req, {
    type: "note",
    ...(await resolveParents(req, req.query)),
  });

  if (req.query.search) {
    const pattern = { $regex: escapeRegex(req.query.search), $options: "i" };
    query.$or = [{ subject: pattern }, { description: pattern }];
  }

  const notes = await CRMActivity.find(query)
    .populate(POPULATE)
    .sort({ createdAt: -1 })
    .limit(listLimit(req));

  return sendSuccess(res, {
    message: "Notes fetched",
    data: notes,
  });
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await CRMActivity.findOne(
    tenantScope(req, { publicId: req.params.publicId, type: "note" })
  );

  if (!note) {
    return sendNotFound(res, "Note not found");
  }

  assertCanEdit(req, note, "crm_note");

  Object.assign(note, noteFields(req.body), {
    updatedBy: req.user._id,
  });

  await note.save();
  await note.populate(POPULATE);

  return sendSuccess(res, {
    message: "Note updated",
    data: note,
  });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await CRMActivity.findOne(
    tenantScope(req, { publicId: req.params.publicId, type: "note" })
  );

  if (!note) {
    return sendNotFound(res, "Note not found");
  }

  assertCanDelete(req, note, "crm_note");
  await softDelete(note, req);

  return sendSuccess(res, { message: "Note deleted" });
});

/* ============================================================================
 * TASKS
 * ========================================================================== */

const TASK_WRITABLE = [
  "title",
  "description",
  "type",
  "status",
  "priority",
  "startAt",
  "dueAt",
  "estimatedMinutes",
  "tags",
];

const OPEN_TASK_STATUSES = ["pending", "in_progress", "deferred", "overdue"];

const applyCompletion = (task, req, completed, body = {}) => {
  if (completed) {
    task.status = "completed";
    task.completedAt = task.completedAt || new Date();
    task.completedBy = req.user._id;
    task.set("completion.completedBy", req.user._id);
    if (body.notes !== undefined) {
      task.set("completion.notes", body.notes ? String(body.notes) : null);
    }
    if (body.outcome !== undefined) {
      task.set("completion.outcome", body.outcome ? String(body.outcome) : null);
    }
  } else {
    task.status = "pending";
    task.completedAt = null;
    task.completedBy = null;
    task.set("completion.completedBy", null);
  }
};

export const createTask = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, TASK_WRITABLE);

  const ownerId =
    (await resolveUser(req, req.body.assignee)) ?? req.user._id;

  const task = new CRMTask({
    ...data,
    ...(await resolveParents(req, req.body)),
    instituteId: requireInstitute(req),
    ownerId,
    assignedBy: req.user._id,
    createdBy: req.user._id,
  });

  if (data.status === "completed") applyCompletion(task, req, true);

  await task.save();
  await task.populate(POPULATE);

  return sendCreated(res, {
    message: "Task created",
    data: task,
  });
});

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, type, search, dueBefore, dueAfter } = req.query;

  const query = tenantScope(req, await resolveParents(req, req.query));

  if (status) {
    const statuses = String(status).split(",").filter(Boolean);
    query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }

  if (priority) query.priority = String(priority);
  if (type) query.type = String(type);

  if (req.query.mine === "true") {
    query.ownerId = req.user._id;
  } else if (req.query.assignee) {
    query.ownerId = await resolveUser(req, req.query.assignee);
  }

  const due = {};
  if (dueBefore) due.$lte = new Date(String(dueBefore));
  if (dueAfter) due.$gte = new Date(String(dueAfter));

  if (req.query.overdue === "true") {
    due.$lt = new Date();
    query.status = { $in: OPEN_TASK_STATUSES };
  }

  for (const value of Object.values(due)) {
    if (Number.isNaN(value.getTime())) {
      throw ApiError.badRequest("Invalid due date filter");
    }
  }

  if (Object.keys(due).length) query.dueAt = due;

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ title: pattern }, { description: pattern }];
  }

  const tasks = await CRMTask.find(query)
    .populate(POPULATE)
    .sort({ dueAt: 1, createdAt: -1 })
    .limit(listLimit(req));

  return sendSuccess(res, {
    message: "Tasks fetched",
    data: tasks,
  });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await CRMTask.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!task) {
    return sendNotFound(res, "Task not found");
  }

  const data = pickFields(req.body, TASK_WRITABLE);
  const { status, ...rest } = data;

  Object.assign(task, rest, await resolveParents(req, req.body), {
    updatedBy: req.user._id,
  });

  if (req.body.assignee) {
    task.ownerId = await resolveUser(req, req.body.assignee);
    task.assignedBy = req.user._id;
  }

  if (status !== undefined) {
    if (status === "completed") {
      applyCompletion(task, req, true);
    } else if (task.status === "completed") {
      applyCompletion(task, req, false);
      task.status = status;
    } else {
      task.status = status;
    }
  }

  await task.save();
  await task.populate(POPULATE);

  return sendSuccess(res, {
    message: "Task updated",
    data: task,
  });
});

export const completeTask = asyncHandler(async (req, res) => {
  const task = await CRMTask.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!task) {
    return sendNotFound(res, "Task not found");
  }

  const completed = req.body?.completed !== false;

  applyCompletion(task, req, completed, req.body ?? {});
  task.updatedBy = req.user._id;

  await task.save();
  await task.populate(POPULATE);

  return sendSuccess(res, {
    message: completed ? "Task completed" : "Task reopened",
    data: task,
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await CRMTask.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!task) {
    return sendNotFound(res, "Task not found");
  }

  assertCanDelete(req, task, "crm_task");
  await softDelete(task, req);

  return sendSuccess(res, { message: "Task deleted" });
});
