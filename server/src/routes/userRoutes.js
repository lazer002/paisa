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
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────────────

router.post(
  "/",
  requireRole(
    "super_admin",
    "admin"
  ),
  createUser
);

// ─────────────────────────────────────────────
// GET USERS
// ─────────────────────────────────────────────

router.get(
  "/",
  requireRole(
    "super_admin",
    "admin"
  ),
  getUsers
);

// ─────────────────────────────────────────────
// USER DETAIL
// Must be before /:publicId
// ─────────────────────────────────────────────

router.get(
  "/:publicId/detail",
  getUserDetail
);

// ─────────────────────────────────────────────
// GET USER
// ─────────────────────────────────────────────

router.get(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin"
  ),
  getUserById
);

// ─────────────────────────────────────────────
// UPDATE USER
// ─────────────────────────────────────────────

router.put(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin"
  ),
  updateUser
);

// ─────────────────────────────────────────────
// DELETE / DEACTIVATE USER
// ─────────────────────────────────────────────

router.delete(
  "/:publicId",
  requireRole(
    "super_admin"
  ),
  deleteUser
);

export default router;