// server/src/routes/userRoutes.js

import express from "express";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  USER_MANAGER_PERMISSIONS,
} from "../controllers/userController.js";
import { hasAnyPermission } from "../utils/permissions.js";
import ApiError from "../utils/ApiError.js";

import { getUserDetail } from "../controllers/userDetailController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validators/userValidator.js";

const router = express.Router();

router.use(authenticate);

// A full user record is for user managers, or the user themself; everyone
// else only gets the directory view from GET /users.
const managerOrSelf = (req, res, next) =>
  req.params.publicId === req.user.publicId ||
  hasAnyPermission(req.user, USER_MANAGER_PERMISSIONS)
    ? next()
    : next(ApiError.forbidden("Access denied", { code: "ACCESS_DENIED" }));

// ─────────────────────────────────────────────
// CREATE USER
// user:create (admin) or user:manage (principal). Which roles each actor
// may create is enforced by CREATABLE_ROLES in the controller.
// ─────────────────────────────────────────────

router.post(
  "/",
  authorize({
    anyPermissions: ["user:create", "user:manage"],
  }),
  validateBody(createUserSchema),
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
  managerOrSelf,
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
  managerOrSelf,
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
  validateBody(updateUserSchema),
  updateUser
);

// ─────────────────────────────────────────────
// DELETE / DEACTIVATE USER
// DELETE /users/:publicId
// ─────────────────────────────────────────────

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["user:delete"],
  }),
  deleteUser
);

export default router;
