// server/src/controllers/fileController.js
//
// POST   /files                 multipart upload (field "file" + purpose)
// GET    /files/:publicId/download  streams the file as an attachment
// DELETE /files/:publicId       uploader, org admin or a manager of the
//                               linked record; removes the stored object
//
// Uploads are never served from a static folder; see services/fileService.js
// for the access rules.

import { File, fileDownloadPath } from "../models/File.js";

import {
  getStorage,
  validateUpload,
  sanitizeOriginalName,
} from "../services/storage/index.js";

import {
  canUploadFor,
  canAccessFile,
  canDeleteFile,
} from "../services/fileService.js";

import { asyncHandler } from "../utils/errorHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { requireInstitute } from "../utils/crudHelpers.js";

const serialize = (file) => ({
  ...file.toJSON(),
  downloadUrl: fileDownloadPath(file.publicId),
});

const sameOrg = (user, file) =>
  user.role === "super_admin" ||
  String(file.instituteId) === String(user.instituteId);

const findActiveFile = async (req) => {
  const file = await File.findOne({
    publicId: String(req.params.publicId),
    isDeleted: false,
  });

  // Another org's file answers exactly like a missing one.
  if (!file || !sameOrg(req.user, file)) {
    throw ApiError.notFound("File not found", { code: "FILE_NOT_FOUND" });
  }

  return file;
};

/** RFC 6266 header with an ASCII fallback and a UTF-8 filename*. */
const contentDisposition = (name) => {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

export const uploadFile = asyncHandler(async (req, res) => {
  const instituteId = requireInstitute(req);
  const { purpose } = req.body;

  if (!canUploadFor(req.user, purpose)) {
    throw ApiError.forbidden("You cannot upload files for this purpose", {
      code: "FILE_UPLOAD_FORBIDDEN",
    });
  }

  if (!req.file) {
    throw ApiError.badRequest('A file is required (multipart field "file")', {
      code: "FILE_REQUIRED",
    });
  }

  const originalName = sanitizeOriginalName(req.file.originalname);

  const { ext, mimeType } = validateUpload({
    originalName,
    mimeType: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer,
  });

  const storage = getStorage();

  const stored = await storage.save({
    tenantId: String(instituteId),
    buffer: req.file.buffer,
    ext,
    mimeType,
  });

  let file;

  try {
    file = await File.create({
      instituteId,
      uploadedBy: req.user._id,
      originalName,
      storageProvider: storage.name,
      storageKey: stored.key,
      mimeType,
      extension: ext,
      size: stored.size,
      checksum: stored.checksum,
      purpose,
      // Avatars are visible to the whole org; everything else stays private
      // to the uploader until a record links it.
      ...(purpose === "avatar"
        ? { visibility: "institute", linkedResource: { kind: "user", id: req.user._id } }
        : {}),
    });
  } catch (error) {
    await storage.remove(stored.key).catch(() => {});
    throw error;
  }

  return sendCreated(res, {
    message: "File uploaded",
    data: serialize(file),
  });
});

export const downloadFile = asyncHandler(async (req, res) => {
  const file = await findActiveFile(req);

  if (!(await canAccessFile(req.user, file))) {
    throw ApiError.forbidden("You cannot access this file", {
      code: "FILE_ACCESS_DENIED",
    });
  }

  const storage = getStorage(file.storageProvider);

  if (!(await storage.exists(file.storageKey))) {
    throw ApiError.notFound("The stored file is missing", {
      code: "FILE_MISSING",
    });
  }

  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Length", String(file.size));
  res.setHeader("Content-Disposition", contentDisposition(file.originalName));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Cache-Control", "private, no-store");

  await new Promise((resolve, reject) => {
    const stream = storage.createReadStream(file.storageKey);

    stream.on("error", (error) => {
      if (res.headersSent) {
        res.destroy(error);
        resolve();
      } else {
        reject(error);
      }
    });

    res.on("finish", resolve);
    res.on("close", resolve);

    stream.pipe(res);
  });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const file = await findActiveFile(req);

  if (!canDeleteFile(req.user, file)) {
    throw ApiError.forbidden("You cannot delete this file", {
      code: "FILE_DELETE_DENIED",
    });
  }

  await getStorage(file.storageProvider).remove(file.storageKey);

  file.isDeleted = true;
  file.deletedAt = new Date();
  file.deletedBy = req.user._id;
  await file.save();

  return sendSuccess(res, { message: "File deleted" });
});
