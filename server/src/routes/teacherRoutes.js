import express from "express";
import { createTeacher, getTeachers } from "../controllers/teacherController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// ✅ Create teacher → Only super_admin or admin
router.post("/", authMiddleware, allowRoles("super_admin", "admin"), createTeacher);

// ✅ Get all teachers → Only super_admin, admin, or teacher
router.get("/", authMiddleware, allowRoles("super_admin", "admin", "teacher"), getTeachers);

export default router;
