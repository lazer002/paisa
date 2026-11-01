// server/src/routes/employeeDocumentRoutes.js

import express from "express";

import {
  createEmployeeDocument,
  getEmployeeDocuments,
  updateEmployeeDocument,
  deleteEmployeeDocument,
} from "../controllers/employeeDocumentController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  createEmployeeDocumentSchema,
  updateEmployeeDocumentSchema,
} from "../validators/hrOpsValidator.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["employee_document:read"] }), getEmployeeDocuments);

router.post(
  "/",
  authorize({ anyPermissions: ["employee_document:create"] }),
  body(createEmployeeDocumentSchema),
  createEmployeeDocument
);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["employee_document:update"] }),
  body(updateEmployeeDocumentSchema),
  updateEmployeeDocument
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["employee_document:delete"] }),
  deleteEmployeeDocument
);

export default router;
