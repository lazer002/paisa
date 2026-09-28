// server/src/routes/employeeRoutes.js

import express from "express";

import {
  createEmployee,
  getEmployees,
} from "../controllers/employeeController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// Create employee
router.post(
  "/",
  requireRole("super_admin", "admin"),
  createEmployee
);

// Get employees
router.get(
  "/",
  requireRole("super_admin", "admin"),
  getEmployees
);

export default router;