import express from "express";
import { createStudent, getStudents } from "../controllers/studentController.js";

const router = express.Router();

// Create student
router.post("/", createStudent);

// Get all students
router.get("/", getStudents);

export default router;
