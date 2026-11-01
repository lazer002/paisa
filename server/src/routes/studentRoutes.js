// server/src/routes/studentRoutes.js

import express from "express";

import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";

import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/studentValidator.js";

const router = express.Router();

router.use(authenticate);

// The student directory and profile edits are for the people who manage
// student profiles (student:create — admin, principal, teacher, counselor).
// student:read alone also covers parents/students/accountant/support, and
// student:update alone covers students, but these handlers list and edit the
// whole institute with no self/child scoping.
const canReadStudents = authorize({
  permissions: ["student:read"],
  anyPermissions: ["student:create"],
});

const canUpdateStudents = authorize({
  permissions: ["student:update"],
  anyPermissions: ["student:create"],
});

// Create student profile
router.post(
  "/",
  authorize({
    anyPermissions: ["student:create"],
  }),
  validateBody(createStudentSchema),
  createStudent
);

// Get students
router.get(
  "/",
  canReadStudents,
  getStudents
);

// Get one student
router.get(
  "/:publicId",
  canReadStudents,
  getStudent
);

// Update student profile
router.put(
  "/:publicId",
  canUpdateStudents,
  validateBody(updateStudentSchema),
  updateStudent
);

// Delete student profile
router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["student:delete"],
  }),
  deleteStudent
);

export default router;
