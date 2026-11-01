// server/src/routes/fileRoutes.js

import express from "express";

import {
  uploadFile,
  downloadFile,
  deleteFile,
} from "../controllers/fileController.js";

import authenticate from "../middleware/authenticate.js";
import { uploadRateLimiter } from "../middleware/rateLimiter.js";
import { singleFile } from "../middleware/upload.js";

import { body } from "../validators/common.js";
import { uploadFileSchema } from "../validators/fileValidator.js";

const router = express.Router();

router.use(authenticate);

// Who may upload depends on `purpose` (checked in the controller).
router.post(
  "/",
  uploadRateLimiter,
  singleFile("file"),
  body(uploadFileSchema),
  uploadFile
);

router.get("/:publicId/download", downloadFile);

router.delete("/:publicId", deleteFile);

export default router;
