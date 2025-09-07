import express from "express";
import { createStudent, getStudents } from "../controllers/studentController.js";
import { authMiddleware, isSuperAdmin, isAdmin, isTeacher, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// ✅ Create student → Only super_admin, admin, or teacher
router.post("/", authMiddleware, allowRoles("super_admin", "admin", "teacher"), createStudent);

// ✅ Get all students → Only super_admin, admin, or teacher
router.get("/", authMiddleware, allowRoles("super_admin", "admin", "teacher"), getStudents);

export default router;
