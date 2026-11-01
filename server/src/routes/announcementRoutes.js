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
import { body } from "../validators/common.js";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validators/communicationValidator.js";

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
  body(createAnnouncementSchema),
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
  body(updateAnnouncementSchema),
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