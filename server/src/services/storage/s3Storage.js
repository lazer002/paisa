// server/src/services/storage/s3Storage.js
//
// S3-compatible provider (STORAGE_PROVIDER=s3) — NOT IMPLEMENTED YET.
//
// The owner's decision is "local disk now, S3-ready". This stub keeps the
// provider interface in one place so switching later is a single file:
//
//   save({ tenantId, buffer, ext, mimeType }) -> { key, size, checksum }
//   exists(key) -> boolean
//   createReadStream(key) -> Readable
//   remove(key) -> void
//
// To implement: PUT/GET/HEAD/DELETE `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
// signed with AWS Signature V4 (node:crypto HMAC-SHA256) using S3_REGION,
// S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY from config/env.js. Generate
// keys exactly like localStorage.js (`<tenant>/<yyyy>/<mm>/<hex>.<ext>`,
// validated by fileRules.assertSafeKey) and keep the bucket private —
// downloads must keep flowing through GET /api/files/:id/download.
// Do not add the AWS SDK for this.

import ApiError from "../../utils/ApiError.js";

const notConfigured = () => {
  throw ApiError.internal("S3 not configured", {
    code: "STORAGE_NOT_CONFIGURED",
  });
};

const s3Storage = {
  name: "s3",
  save: async () => notConfigured(),
  exists: async () => notConfigured(),
  createReadStream: () => notConfigured(),
  remove: async () => notConfigured(),
};

export default s3Storage;
