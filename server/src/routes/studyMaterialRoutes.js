// server/src/routes/studyMaterialRoutes.js

import express from "express";

import {
  createStudyMaterial,
  getStudyMaterials,
  updateStudyMaterial,
  deleteStudyMaterial,
} from "../controllers/studyMaterialController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  createStudyMaterialSchema,
  updateStudyMaterialSchema,
} from "../validators/academicValidator.js";

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
  authorize({ anyPermissions: ["study_material:create"] }),
  body(createStudyMaterialSchema),
  createStudyMaterial
);

// Update study material
router.put(
  "/:publicId",
  authorize({ anyPermissions: ["study_material:update"] }),
  body(updateStudyMaterialSchema),
  updateStudyMaterial
);

// Delete study material
router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["study_material:delete"] }),
  deleteStudyMaterial
);

export default router;