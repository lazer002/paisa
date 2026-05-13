import express from "express";
import { markAttendance, getAttendance, getMyAttendance } from "../controllers/attendanceController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/me", getMyAttendance);
router.get("/", allowRoles("super_admin", "admin", "teacher", "hr"), getAttendance);
router.post("/", allowRoles("super_admin", "admin", "teacher"), markAttendance);

export default router;
