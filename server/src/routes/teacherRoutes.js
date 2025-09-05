import express from "express";
import { createTeacher, getTeachers } from "../controllers/teacherController.js";

const router = express.Router();

// Create teacher
router.post("/", createTeacher);

// Get all teachers
router.get("/", getTeachers);

export default router;
