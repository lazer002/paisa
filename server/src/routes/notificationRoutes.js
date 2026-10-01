// server/src/routes/notificationRoutes.js

import express from "express";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  broadcastNotification,
} from "../controllers/notificationController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// FEED (self)
// ─────────────────────────────────────────────

router.get(
  "/",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  getNotifications
);

router.post(
  "/read-all",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  markAllNotificationsRead
);

router.put(
  "/:publicId/read",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  markNotificationRead
);

router.put(
  "/:publicId/archive",
  authorize({
    anyPermissions: ["notification:read"],
  }),
  archiveNotification
);

// ─────────────────────────────────────────────
// PREFERENCES (self)
// ─────────────────────────────────────────────

router.get(
  "/preferences",
  authorize({
    anyPermissions: [
      "notification_preference:read",
    ],
  }),
  getNotificationPreferences
);

router.put(
  "/preferences",
  authorize({
    anyPermissions: [
      "notification_preference:update",
    ],
  }),
  updateNotificationPreferences
);

// ─────────────────────────────────────────────
// BROADCAST (admin)
// ─────────────────────────────────────────────

router.post(
  "/broadcast",
  authorize({
    anyPermissions: ["notification:create"],
  }),
  broadcastNotification
);

export default router;
