// server/src/routes/liveSessionRoutes.js

import express from "express";

import {
  createLiveSession,
  getLiveSessions,
  getLiveSession,
  updateLiveSession,
  deleteLiveSession,
  joinLiveSession,
  getLiveSessionParticipants,
} from "../controllers/liveSessionController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

import { body } from "../validators/common.js";

import {
  createLiveSessionSchema,
  updateLiveSessionSchema,
  joinLiveSessionSchema,
} from "../validators/academicValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize({
    anyPermissions: ["live_session:read"],
  }),
  getLiveSessions
);

router.get(
  "/:publicId",
  authorize({
    anyPermissions: ["live_session:read"],
  }),
  getLiveSession
);

// Anyone who may see the session may join it (the controller checks access
// mode / class membership and records attendance).
router.post(
  "/:publicId/join",
  authorize({
    anyPermissions: ["live_session:read"],
  }),
  body(joinLiveSessionSchema),
  joinLiveSession
);

// Roster for the host / admins (checked in the controller).
router.get(
  "/:publicId/participants",
  authorize({
    anyPermissions: ["live_session:read"],
  }),
  getLiveSessionParticipants
);

router.post(
  "/",
  authorize({
    anyPermissions: ["live_session:create"],
  }),
  body(createLiveSessionSchema),
  createLiveSession
);

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["live_session:update"],
  }),
  body(updateLiveSessionSchema),
  updateLiveSession
);

router.delete(
  "/:publicId",
  authorize({
    anyPermissions: ["live_session:delete"],
  }),
  deleteLiveSession
);

export default router;
