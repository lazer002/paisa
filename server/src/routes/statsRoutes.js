import express from "express";
import {
  getSuperAdminStats, getAdminStats, getTeacherStats,
  getStudentStats, getHRStats, getEmployeeStats,
} from "../controllers/statsController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/superadmin", allowRoles("super_admin"), getSuperAdminStats);
router.get("/admin", allowRoles("super_admin", "admin"), getAdminStats);
router.get("/teacher", allowRoles("teacher"), getTeacherStats);
router.get("/student", allowRoles("student"), getStudentStats);
router.get("/hr", allowRoles("super_admin", "admin", "hr"), getHRStats);
router.get("/employee", allowRoles("employee"), getEmployeeStats);

export default router;
