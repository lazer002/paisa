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
  createClass
);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["class:update"] }),
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
  enrollStudent
);

router.delete(
  "/:publicId/students/:studentId",
  authorize({ anyPermissions: ["enrollment:delete"] }),
  removeStudent
);

export default router;