import express from "express";
import { createEmployee, getEmployees } from "../controllers/employeeController.js";
import { authMiddleware, isAdmin, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

// Only Admins or SuperAdmins can create Employee
router.post("/", authMiddleware, isAdmin, createEmployee);

// Get all Employees
router.get("/", authMiddleware, isAdmin, getEmployees);

export default router;
