import express from "express";
import {
  createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement,
} from "../controllers/announcementController.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getAnnouncements);
router.post("/", allowRoles("super_admin", "admin"), createAnnouncement);
router.put("/:id", allowRoles("super_admin", "admin"), updateAnnouncement);
router.delete("/:id", allowRoles("super_admin", "admin"), deleteAnnouncement);

export default router;
