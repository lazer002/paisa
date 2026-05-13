import express from "express";
import {
  createClass, getClasses, getClass, updateClass, deleteClass,
  enrollStudent, removeStudent,
} from "../controllers/classController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", allowRoles("super_admin", "admin", "teacher", "student"), getClasses);
router.get("/:id", allowRoles("super_admin", "admin", "teacher", "student"), getClass);
router.post("/", allowRoles("super_admin", "admin", "teacher"), createClass);
router.put("/:id", allowRoles("super_admin", "admin", "teacher"), updateClass);
router.delete("/:id", allowRoles("super_admin", "admin"), deleteClass);
router.post("/:id/enroll", allowRoles("super_admin", "admin"), enrollStudent);
router.delete("/:id/students/:studentId", allowRoles("super_admin", "admin"), removeStudent);

export default router;
