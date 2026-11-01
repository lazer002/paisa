// server/src/routes/paymentRoutes.js

import express from "express";

import {
  getPayments,
  getPayment,
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  refundPayment,
} from "../controllers/paymentController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";
import {
  razorpayOrderSchema,
  razorpayVerifySchema,
  refundSchema,
} from "../validators/billingValidator.js";

const router = express.Router();

// Called by Razorpay, authenticated by its HMAC signature instead of a user.
// No body validator here: the signature is checked over the raw body.
router.post(
  "/razorpay/webhook",
  razorpayWebhook
);

router.use(authenticate);

router.get(
  "/config",
  getPaymentConfig
);

router.get(
  "/",
  authorize({
    anyPermissions: ["payment:read"],
  }),
  getPayments
);

// Invoice owners (students, parents, employees) and finance staff may pay.
router.post(
  "/razorpay/order",
  authorize({
    anyPermissions: ["invoice:read"],
  }),
  body(razorpayOrderSchema),
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  authorize({
    anyPermissions: ["invoice:read"],
  }),
  body(razorpayVerifySchema),
  verifyRazorpayPayment
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["payment:read"],
  }),
  getPayment
);

router.post(
  "/:publicId/refund",
  authorize({
    anyPermissions: ["payment:refund"],
  }),
  body(refundSchema),
  refundPayment
);

export default router;
