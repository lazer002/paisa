// src/routes/classRoutes.js

import express from "express";

import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudent,
} from "../controllers/classController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  createClassSchema,
  updateClassSchema,
  enrollStudentSchema,
} from "../validators/academicValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({ anyPermissions: ["class:read"] }),
  getClasses
);

router.get(
  "/:publicId",
  authorize({ anyPermissions: ["class:read"] }),
  getClass
);

router.post(
  "/",
  authorize({ anyPermissions: ["class:create"] }),
  body(createClassSchema),
  createClass
);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["class:update"] }),
  body(updateClassSchema),
  updateClass
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["class:delete"] }),
  deleteClass
);

router.post(
  "/:publicId/enroll",
  authorize({ anyPermissions: ["enrollment:create"] }),
  body(enrollStudentSchema),
  enrollStudent
);

router.delete(
  "/:publicId/students/:studentId",
  authorize({ anyPermissions: ["enrollment:delete"] }),
  removeStudent
);

export default router;