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

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["employee_document:read"] }), getEmployeeDocuments);

router.post("/", authorize({ anyPermissions: ["employee_document:create"] }), createEmployeeDocument);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["employee_document:update"] }),
  updateEmployeeDocument
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["employee_document:delete"] }),
  deleteEmployeeDocument
);

export default router;
