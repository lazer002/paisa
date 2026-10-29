// server/src/routes/auditRoutes.js

import express from "express";

import { getAuditLogs } from "../controllers/auditController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({
    anyPermissions: ["audit:read"],
  }),
  getAuditLogs
);

export default router;
