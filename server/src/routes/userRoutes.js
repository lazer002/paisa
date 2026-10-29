// server/src/routes/userRoutes.js

import express from "express";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import { getUserDetail } from "../controllers/userDetailController.js";

import authenticate from "../middleware/authenticate.js";
import {
  requireRole,
  authorize,
} from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────────────

router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "principal"
  ),
  createUser
);

// ─────────────────────────────────────────────
// GET USERS
// ─────────────────────────────────────────────

router.get(
  "/",
  authorize({
    anyPermissions: ["user:read"],
  }),
  getUsers
);

// ─────────────────────────────────────────────
// USER DETAIL
// GET /users/:publicId/detail
// ─────────────────────────────────────────────

router.get(
  "/:publicId/detail",
  authorize({
    anyPermissions: ["user:read"],
  }),
  getUserDetail
);

// ─────────────────────────────────────────────
// GET USER
// GET /users/:publicId
// ─────────────────────────────────────────────

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["user:read"],
  }),
  getUserById
);

// ─────────────────────────────────────────────
// UPDATE USER
// PUT /users/:publicId
// ─────────────────────────────────────────────

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["user:update"],
  }),
  updateUser
);

// ─────────────────────────────────────────────
// DELETE / DEACTIVATE USER
// DELETE /users/:publicId
// ─────────────────────────────────────────────

router.delete(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin"
  ),
  deleteUser
);

export default router;