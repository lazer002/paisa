import express from "express";
import { submitAssignment, getSubmissions, getSubmission, gradeSubmission } from "../controllers/submissionController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getSubmissions);
router.post("/", allowRoles("student"), submitAssignment);
router.get("/:id", getSubmission);
router.put("/:id/grade", allowRoles("super_admin", "admin", "teacher"), gradeSubmission);

export default router;
