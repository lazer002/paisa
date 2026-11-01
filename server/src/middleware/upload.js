// server/src/middleware/upload.js
//
// Multipart parsing for /api/files. One file per request, kept in memory
// (capped at MAX_FILE_SIZE_MB) so it can be checked before anything is
// written to storage. Multer errors become ApiErrors (413 / 400).

import multer from "multer";

import ApiError from "../utils/ApiError.js";
import { MAX_FILE_SIZE_BYTES } from "../services/storage/fileRules.js";
import env from "../config/env.js";

const parser = multer({
  storage: multer.memoryStorage(),
  defParamCharset: "utf8",
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 10,
    fieldSize: 10 * 1024,
    parts: 12,
  },
});

export const singleFile = (field = "file") => (req, res, next) => {
  parser.single(field)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new ApiError(`File is larger than ${env.MAX_FILE_SIZE_MB} MB`, 413, {
            code: "FILE_TOO_LARGE",
          })
        );
      }

      return next(
        ApiError.badRequest(
          error.code === "LIMIT_UNEXPECTED_FILE"
            ? `Send exactly one file in the "${field}" field`
            : error.message,
          { code: "UPLOAD_INVALID" }
        )
      );
    }

    return next(error);
  });
};

export default singleFile;
