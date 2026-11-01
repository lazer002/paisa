// server/src/services/storage/fileRules.js
//
// Upload rules shared by every storage provider and by /api/files:
// size cap, allow-list of extensions + MIME types, a magic-byte check so a
// renamed executable cannot pass as a PDF, and a display-name sanitizer.
// Client names are never used for anything but display.

import env from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";

export const MAX_FILE_SIZE_BYTES =
  Math.max(1, Number(env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const OOXML = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/**
 * extension → { mimes the browser may send, canonical mime we store/serve,
 * signature check }.
 */
const RULES = Object.freeze({
  pdf: { mimes: ["application/pdf"], sniff: "pdf" },
  png: { mimes: ["image/png"], sniff: "png" },
  jpg: { mimes: ["image/jpeg", "image/pjpeg"], canonical: "image/jpeg", sniff: "jpg" },
  jpeg: { mimes: ["image/jpeg", "image/pjpeg"], canonical: "image/jpeg", sniff: "jpg" },
  webp: { mimes: ["image/webp"], sniff: "webp" },
  doc: { mimes: ["application/msword"], sniff: "ole" },
  docx: { mimes: [OOXML.docx], sniff: "zip" },
  xls: { mimes: ["application/vnd.ms-excel"], sniff: "ole" },
  xlsx: { mimes: [OOXML.xlsx], sniff: "zip" },
  ppt: { mimes: ["application/vnd.ms-powerpoint"], sniff: "ole" },
  pptx: { mimes: [OOXML.pptx], sniff: "zip" },
  txt: { mimes: ["text/plain"], sniff: "text" },
  // Windows browsers send CSV as application/vnd.ms-excel.
  csv: {
    mimes: ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"],
    canonical: "text/csv",
    sniff: "text",
  },
  zip: {
    mimes: ["application/zip", "application/x-zip-compressed"],
    canonical: "application/zip",
    sniff: "zip",
  },
});

export const ALLOWED_EXTENSIONS = Object.freeze(Object.keys(RULES));

const startsWith = (buffer, bytes, offset = 0) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, index) => buffer[offset + index] === byte);

const SNIFFERS = {
  pdf: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  webp: (b) =>
    startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
  ole: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  zip: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) || startsWith(b, [0x50, 0x4b, 0x05, 0x06]),
  // Plain text: no NUL bytes in the first 8 KB.
  text: (b) => !b.subarray(0, 8192).includes(0),
};

/** Display-only name: no path parts, control or reserved characters. */
export const sanitizeOriginalName = (name) => {
  const base = String(name ?? "")
    .split(/[\\/]/)
    .pop()
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 200);

  return base || "file";
};

export const extensionOf = (name) => {
  const match = /\.([a-z0-9]{1,8})$/i.exec(String(name ?? ""));
  return match ? match[1].toLowerCase() : "";
};

/**
 * Validates an in-memory upload. Returns the extension and the canonical
 * MIME type to store. Throws 413 (size) / 415 (type) / 400 (empty).
 */
export const validateUpload = ({ originalName, mimeType, size, buffer }) => {
  if (!buffer || !size) {
    throw ApiError.badRequest("The file is empty", { code: "FILE_EMPTY" });
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(
      `File is larger than ${env.MAX_FILE_SIZE_MB} MB`,
      413,
      { code: "FILE_TOO_LARGE" }
    );
  }

  const ext = extensionOf(originalName);
  const rule = RULES[ext];
  const mime = String(mimeType ?? "").toLowerCase().split(";")[0].trim();

  if (!rule) {
    throw new ApiError(
      `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      415,
      { code: "FILE_TYPE_NOT_ALLOWED" }
    );
  }

  if (!rule.mimes.includes(mime)) {
    throw new ApiError(
      "File content type does not match its extension",
      415,
      { code: "FILE_TYPE_MISMATCH" }
    );
  }

  if (!SNIFFERS[rule.sniff](buffer)) {
    throw new ApiError(
      "File content does not match its type",
      415,
      { code: "FILE_CONTENT_MISMATCH" }
    );
  }

  return {
    ext: ext === "jpeg" ? "jpg" : ext,
    mimeType: rule.canonical ?? rule.mimes[0],
  };
};

/** Storage keys we generate: <tenant>/<yyyy>/<mm>/<32 hex>.<ext> */
export const STORAGE_KEY_PATTERN =
  /^[a-f0-9]{24}\/\d{4}\/\d{2}\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/;

export const assertSafeKey = (key) => {
  if (!STORAGE_KEY_PATTERN.test(String(key ?? ""))) {
    throw ApiError.internal("Invalid storage key", { code: "STORAGE_KEY_INVALID" });
  }

  return key;
};
