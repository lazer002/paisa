// server/src/routes/departmentRoutes.js

import express from "express";

import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get departments
router.get(
  "/",
  getDepartments
);

// Create department
router.post(
  "/",
  authorize({ anyPermissions: ["department:create"] }),
  createDepartment
);

// Update department
router.put(
  "/:publicId",
  authorize({ anyPermissions: ["department:update"] }),
  updateDepartment
);

// Delete department
router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["department:delete"] }),
  deleteDepartment
);

export default router;