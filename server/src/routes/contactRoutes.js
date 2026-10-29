// server/src/routes/contactRoutes.js

import express from "express";

import {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["contact:read"] }), getContacts);

router.post("/", authorize({ anyPermissions: ["contact:create"] }), createContact);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["contact:update"] }),
  updateContact
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["contact:delete"] }),
  deleteContact
);

export default router;
