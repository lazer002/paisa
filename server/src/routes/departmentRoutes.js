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
import { body } from "../validators/common.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validators/organizationValidator.js";

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
  body(createDepartmentSchema),
  createDepartment
);

// Update department
router.put(
  "/:publicId",
  authorize({ anyPermissions: ["department:update"] }),
  body(updateDepartmentSchema),
  updateDepartment
);

// Delete department
router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["department:delete"] }),
  deleteDepartment
);

export default router;