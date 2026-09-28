// server/src/routes/organizationRoutes.js

import express from "express";

import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizations,
  updateOrganization,
} from "../controllers/organizationController.js";

import {
  adminAccess,
  superAdminOnly,
} from "../middleware/policies.js";

const router = express.Router();

// ─────────────────────────────────────────────
// GET ALL ORGANIZATIONS
// ─────────────────────────────────────────────

router.get(
  "/",
  adminAccess,
  getOrganizations
);

// ─────────────────────────────────────────────
// GET ONE ORGANIZATION
// Public URL uses publicId
// ─────────────────────────────────────────────

router.get(
  "/:publicId",
  adminAccess,
  getOrganization
);

// ─────────────────────────────────────────────
// CREATE ORGANIZATION
// Super admin only
// ─────────────────────────────────────────────

router.post(
  "/",
  superAdminOnly,
  createOrganization
);

// ─────────────────────────────────────────────
// UPDATE ORGANIZATION
// Admin can update their own organization.
// Controller enforces field-level restrictions.
// ─────────────────────────────────────────────

router.put(
  "/:publicId",
  adminAccess,
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

export default router;