// server/src/routes/teacherRoutes.js

import express from "express";

import {
  createTeacher,
  getTeachers,
} from "../controllers/teacherController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";

import { createTeacherSchema } from "../validators/teacherValidator.js";

const router = express.Router();

router.use(authenticate);

// Create teacher (teacher:create — admin, principal)
router.post(
  "/",
  authorize({
    anyPermissions: ["teacher:create"],
  }),
  validateBody(createTeacherSchema),
  createTeacher
);

// Get teachers (teacher:read — admin, principal, hr, teacher)
router.get(
  "/",
  authorize({
    anyPermissions: ["teacher:read"],
  }),
  getTeachers
);

export default router;
