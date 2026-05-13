import express from "express";
import {
  createStudyMaterial, getStudyMaterials, updateStudyMaterial, deleteStudyMaterial,
} from "../controllers/studyMaterialController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getStudyMaterials);
router.post("/", allowRoles("super_admin", "admin", "teacher"), createStudyMaterial);
router.put("/:id", allowRoles("super_admin", "admin", "teacher"), updateStudyMaterial);
router.delete("/:id", allowRoles("super_admin", "admin", "teacher"), deleteStudyMaterial);

export default router;
