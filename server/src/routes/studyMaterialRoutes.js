// server/src/routes/studyMaterialRoutes.js

import express from "express";

import {
  createStudyMaterial,
  getStudyMaterials,
  updateStudyMaterial,
  deleteStudyMaterial,
} from "../controllers/studyMaterialController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get study materials
router.get(
  "/",
  getStudyMaterials
);

// Create study material
router.post(
  "/",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  createStudyMaterial
);

// Update study material
router.put(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  updateStudyMaterial
);

// Delete study material
router.delete(
  "/:publicId",
  requireRole(
    "super_admin",
    "admin",
    "teacher"
  ),
  deleteStudyMaterial
);

export default router;