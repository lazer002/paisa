import express from "express";

import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

// Get all announcements
router.get(
  "/",
  getAnnouncements
);

// Get single announcement by publicId
router.get(
  "/:publicId",
  getAnnouncementById
);

// Create announcement
router.post(
  "/",
  authorize({
    anyPermissions: ["notification:create"],
  }),
  createAnnouncement
);

// Update announcement
router.put(
  "/:publicId",
  authorize({
    anyPermissions: [
      "notification:create",
      "notification:update",
    ],
  }),
  updateAnnouncement
);

// Delete announcement
router.delete(
  "/:publicId",
  authorize({
    anyPermissions: [
      "notification:create",
      "notification:delete",
    ],
  }),
  deleteAnnouncement
);

export default router;