// server/src/routes/billingRoutes.js

import express from "express";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoiceStatus,
  recordPayment,
  deleteInvoice,
} from "../controllers/billingController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({
    anyPermissions: ["invoice:read"],
  }),
  getInvoices
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["invoice:read"],
  }),
  getInvoice
);

router.post(
  "/",
  authorize({
    anyPermissions: ["invoice:create"],
  }),
  createInvoice
);

router.post(
  "/:publicId/payments",
  authorize({
    anyPermissions: ["payment:create", "invoice:update"],
  }),
  recordPayment
);

router.put(
  "/:publicId/status",
  authorize({
    anyPermissions: ["invoice:update"],
  }),
  updateInvoiceStatus
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["invoice:delete"],
  }),
  deleteInvoice
);

export default router;
