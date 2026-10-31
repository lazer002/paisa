// server/src/routes/crmActivityRoutes.js
//
// /crm-activities, /crm-tasks and /crm-notes. Delete is also open to the
// :create holders (counselor) — the controller limits them to records they
// created.

import express from "express";

import {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  createTask,
  getTasks,
  updateTask,
  completeTask,
  deleteTask,
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/crmActivityController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const can = (...anyPermissions) => authorize({ anyPermissions });

/* ─── Activities ─────────────────────────────── */

const activityRouter = express.Router();

activityRouter.use(authenticate);

activityRouter.get(
  "/",
  can("crm_activity:read", "crm_activity:manage"),
  getActivities
);

activityRouter.post(
  "/",
  can("crm_activity:create", "crm_activity:manage"),
  createActivity
);

activityRouter.put(
  "/:publicId",
  can("crm_activity:update", "crm_activity:manage"),
  updateActivity
);

activityRouter.delete(
  "/:publicId",
  can("crm_activity:delete", "crm_activity:manage", "crm_activity:create"),
  deleteActivity
);

/* ─── Tasks ──────────────────────────────────── */

export const taskRouter = express.Router();

taskRouter.use(authenticate);

taskRouter.get(
  "/",
  can("crm_task:read", "crm_task:manage"),
  getTasks
);

taskRouter.post(
  "/",
  can("crm_task:create", "crm_task:manage"),
  createTask
);

taskRouter.put(
  "/:publicId",
  can("crm_task:update", "crm_task:manage"),
  updateTask
);

taskRouter.patch(
  "/:publicId/complete",
  can("crm_task:update", "crm_task:manage"),
  completeTask
);

taskRouter.delete(
  "/:publicId",
  can("crm_task:delete", "crm_task:manage", "crm_task:create"),
  deleteTask
);

/* ─── Notes ──────────────────────────────────── */

export const noteRouter = express.Router();

noteRouter.use(authenticate);

noteRouter.get(
  "/",
  can("crm_note:read", "crm_note:manage"),
  getNotes
);

noteRouter.post(
  "/",
  can("crm_note:create", "crm_note:manage"),
  createNote
);

noteRouter.put(
  "/:publicId",
  can("crm_note:update", "crm_note:manage"),
  updateNote
);

noteRouter.delete(
  "/:publicId",
  can("crm_note:delete", "crm_note:manage", "crm_note:create"),
  deleteNote
);

export default activityRouter;
