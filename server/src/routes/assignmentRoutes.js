import express from "express";
import {
  createAssignment, getAssignments, getAssignment, updateAssignment, deleteAssignment,
} from "../controllers/assignmentController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", allowRoles("super_admin", "admin", "teacher", "student"), getAssignments);
router.get("/:id", allowRoles("super_admin", "admin", "teacher", "student"), getAssignment);
router.post("/", allowRoles("super_admin", "admin", "teacher"), createAssignment);
router.put("/:id", allowRoles("super_admin", "admin", "teacher"), updateAssignment);
router.delete("/:id", allowRoles("super_admin", "admin", "teacher"), deleteAssignment);

export default router;
