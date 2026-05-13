import express from "express";
import { createDepartment, getDepartments, updateDepartment, deleteDepartment } from "../controllers/departmentController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getDepartments);
router.post("/", allowRoles("super_admin", "admin", "hr"), createDepartment);
router.put("/:id", allowRoles("super_admin", "admin", "hr"), updateDepartment);
router.delete("/:id", allowRoles("super_admin", "admin"), deleteDepartment);

export default router;
