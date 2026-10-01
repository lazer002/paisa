// server/src/routes/liveSessionRoutes.js

import express from "express";

import {
  createLiveSession,
  getLiveSessions,
  getLiveSession,
  updateLiveSession,
  deleteLiveSession,
} from "../controllers/liveSessionController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

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

router.post(
  "/",
  authorize({
    anyPermissions: ["live_session:create"],
  }),
  createLiveSession
);

router.put(
  "/:publicId",
  authorize({
    anyPermissions: ["live_session:update"],
  }),
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
