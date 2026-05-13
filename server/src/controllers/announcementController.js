import { Announcement } from "../models/Announcement.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated, sendNotFound } from "../utils/response.js";

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, targetRoles, priority, expiresAt } = req.body;

  const announcement = await Announcement.create({
    instituteId: req.user.instituteId || null,
    createdBy: req.user._id,
    title,
    content,
    targetRoles: targetRoles?.length ? targetRoles : ["all"],
    priority: priority || "medium",
    expiresAt,
  });

  sendCreated(res, "Announcement created", announcement);
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  let query = { isActive: true };

  if (req.user.role === "super_admin") {
    // super_admin sees all
  } else {
    query.$or = [
      { instituteId: req.user.instituteId },
      { instituteId: null },
    ];
  }

  const announcements = await Announcement.find(query)
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });

  sendSuccess(res, "Announcements fetched", announcements);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) return sendNotFound(res, "Announcement not found");
  sendSuccess(res, "Announcement updated", announcement);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return sendNotFound(res, "Announcement not found");
  sendSuccess(res, "Announcement deleted");
});
