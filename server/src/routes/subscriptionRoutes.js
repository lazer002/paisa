// server/src/routes/subscriptionRoutes.js
//
// Organization subscription billing (F4). finance:* is held by admin,
// accountant and super_admin. The Razorpay webhook for subscription orders is
// the shared one at POST /payments/razorpay/webhook.

import express from "express";

import {
  getPlans,
  getCurrentSubscription,
  createCheckout,
  verifyCheckout,
  cancelSubscription,
  resumeSubscriptionHandler,
  overrideSubscriptionHandler,
} from "../controllers/subscriptionController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { superAdminOnly } from "../middleware/policies.js";

import { body } from "../validators/common.js";
import {
  checkoutSchema,
  verifySchema,
  cancelSchema,
  resumeSchema,
  overrideSchema,
} from "../validators/subscriptionValidator.js";

const router = express.Router();

router.use(authenticate);

const canRead = authorize({ anyPermissions: ["finance:read"] });
const canManage = authorize({ anyPermissions: ["finance:manage"] });

router.get("/plans", canRead, getPlans);

router.get("/current", canRead, getCurrentSubscription);

router.post("/checkout", canManage, body(checkoutSchema), createCheckout);

router.post("/verify", canManage, body(verifySchema), verifyCheckout);

router.post("/cancel", canManage, body(cancelSchema), cancelSubscription);

router.post("/resume", canManage, body(resumeSchema), resumeSubscriptionHandler);

router.post("/override", superAdminOnly, body(overrideSchema), overrideSubscriptionHandler);

export default router;
