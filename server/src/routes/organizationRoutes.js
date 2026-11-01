// server/src/routes/organizationRoutes.js

import express from "express";

import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizations,
  restoreOrganization,
  updateOrganization,
} from "../controllers/organizationController.js";

import authenticate from "../middleware/authenticate.js";
import { superAdminOnly } from "../middleware/policies.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "../validators/organizationValidator.js";

const router = express.Router();

// authorize() needs req.user; without this every read/update was a 401.
router.use(authenticate);

// Non-super-admins are scoped to their own organization
// by scopeQueryForUser in the controller.
const canReadOrganizations = authorize({
  anyPermissions: ["organization:read"],
});

// ─────────────────────────────────────────────
// GET ALL ORGANIZATIONS
// ─────────────────────────────────────────────

router.get(
  "/",
  canReadOrganizations,
  getOrganizations
);

// ─────────────────────────────────────────────
// GET ONE ORGANIZATION
// Public URL uses publicId
// ─────────────────────────────────────────────

router.get(
  "/:publicId",
  canReadOrganizations,
  getOrganization
);

// ─────────────────────────────────────────────
// CREATE ORGANIZATION
// Super admin only
// ─────────────────────────────────────────────

router.post(
  "/",
  superAdminOnly,
  body(createOrganizationSchema),
  createOrganization
);

// ─────────────────────────────────────────────
// UPDATE ORGANIZATION
// Admin/principal can update their own organization.
// Controller enforces field-level restrictions:
// plan/status/type changes stay super_admin-only.
// ─────────────────────────────────────────────

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["organization:update"],
  }),
  body(updateOrganizationSchema),
  updateOrganization
);

// ─────────────────────────────────────────────
// DELETE ORGANIZATION
// Super admin only
// ─────────────────────────────────────────────

router.delete(
  "/:publicId",
  superAdminOnly,
  deleteOrganization
);

// ─────────────────────────────────────────────
// RESTORE ORGANIZATION
// Super admin only
// ─────────────────────────────────────────────

router.post(
  "/:publicId/restore",
  superAdminOnly,
  restoreOrganization
);

export default router;