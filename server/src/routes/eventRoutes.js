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

import { body } from "../validators/common.js";

import {
  createEventSchema,
  updateEventSchema,
} from "../validators/communicationValidator.js";

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
  body(createEventSchema),
  createEvent
);

// Creators may edit/delete their own events; managers any (controller).
router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["notification:update", "notification:create"],
  }),
  body(updateEventSchema),
  updateEvent
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["notification:delete", "notification:create"],
  }),
  deleteEvent
);

export default router;
