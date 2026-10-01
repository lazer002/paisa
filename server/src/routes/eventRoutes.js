// server/src/routes/eventRoutes.js

import express from "express";

import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  getEvents
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  getEvent
);

router.post(
  "/",
  authorize({
    anyPermissions: ["notification:create"],
  }),
  createEvent
);

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["notification:update"],
  }),
  updateEvent
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["notification:delete"],
  }),
  deleteEvent
);

export default router;
