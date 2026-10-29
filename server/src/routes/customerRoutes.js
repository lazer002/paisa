// server/src/routes/customerRoutes.js

import express from "express";

import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["customer:read"] }), getCustomers);

router.post("/", authorize({ anyPermissions: ["customer:create"] }), createCustomer);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["customer:update"] }),
  updateCustomer
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["customer:delete"] }),
  deleteCustomer
);

export default router;
