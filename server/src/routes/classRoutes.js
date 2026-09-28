// src/routes/classRoutes.js

import express from "express";

import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudent,
} from "../controllers/classController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher",
    "student"
  ),
  getClasses
);

router.get(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "teacher",
    "student"
  ),
  getClass
);

router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  createClass
);

router.put(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  updateClass
);

router.delete(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin"
  ),
  deleteClass
);

router.post(
  "/:publicId/enroll",
  requireRole(
    "super_admin",
    "admin"
  ),
  enrollStudent
);

router.delete(
  "/:publicId/students/:studentId",
  requireRole(
    "super_admin",
    "admin"
  ),
  removeStudent
);

export default router;