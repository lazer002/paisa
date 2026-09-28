import express from "express";

import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import authenticate from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";

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
  requireRole("super_admin", "admin"),
  createAnnouncement
);

// Update announcement
router.put(
  "/:publicId",
  requireRole("super_admin", "admin"),
  updateAnnouncement
);

// Delete announcement
router.delete(
  "/:publicId",
  requireRole("super_admin", "admin"),
  deleteAnnouncement
);

export default router;