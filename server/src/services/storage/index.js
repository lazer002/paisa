// server/src/services/storage/index.js
//
// Picks the storage provider from STORAGE_PROVIDER (local | s3).

import env from "../../config/env.js";

import localStorage from "./localStorage.js";
import s3Storage from "./s3Storage.js";

const PROVIDERS = Object.freeze({
  local: localStorage,
  s3: s3Storage,
});

/** Provider by name; defaults to the configured one. */
export const getStorage = (name = env.STORAGE_PROVIDER) => {
  const provider = PROVIDERS[String(name || "local").toLowerCase()];

  if (!provider) {
    throw new Error(`Unknown STORAGE_PROVIDER "${name}"`);
  }

  return provider;
};

export {
  validateUpload,
  sanitizeOriginalName,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from "./fileRules.js";
