// src/routes/assignmentRoutes.js

import express from "express";

import {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../validators/academicValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({ anyPermissions: ["assignment:read"] }),
  getAssignments
);

router.get(
  "/:publicId",
  authorize({ anyPermissions: ["assignment:read"] }),
  getAssignment
);

router.post(
  "/",
  authorize({ anyPermissions: ["assignment:create"] }),
  body(createAssignmentSchema),
  createAssignment
);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["assignment:update"] }),
  body(updateAssignmentSchema),
  updateAssignment
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["assignment:delete"] }),
  deleteAssignment
);

export default router;