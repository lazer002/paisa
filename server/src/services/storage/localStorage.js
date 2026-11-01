// server/src/services/storage/localStorage.js
//
// Local-disk provider. Files live under STORAGE_PATH (resolved relative to
// server/), one folder per tenant, with random names we generate. The folder
// is never exposed as a static route: every read goes through /api/files.

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import env from "../../config/env.js";
import { assertSafeKey } from "./fileRules.js";

const SERVER_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

export const STORAGE_ROOT = path.resolve(
  SERVER_ROOT,
  env.STORAGE_PATH || "./uploads"
);

/** Absolute path for a key, refusing anything that escapes the root. */
const resolveKey = (key) => {
  assertSafeKey(key);

  const absolute = path.resolve(STORAGE_ROOT, ...key.split("/"));

  if (!absolute.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error("Storage key escapes the storage root");
  }

  return absolute;
};

const buildKey = (tenantId, ext) => {
  const tenant = String(tenantId ?? "");

  if (!/^[a-f0-9]{24}$/.test(tenant)) {
    throw new Error("A tenant id is required to store a file");
  }

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const name = crypto.randomBytes(16).toString("hex");

  return `${tenant}/${yyyy}/${mm}/${name}.${ext}`;
};

const localStorage = {
  name: "local",

  async save({ tenantId, buffer, ext }) {
    const key = buildKey(tenantId, ext);
    const absolute = resolveKey(key);

    await fsp.mkdir(path.dirname(absolute), { recursive: true });
    // "wx": never overwrite an existing object.
    await fsp.writeFile(absolute, buffer, { flag: "wx", mode: 0o600 });

    return {
      key,
      size: buffer.length,
      checksum: crypto.createHash("sha256").update(buffer).digest("hex"),
    };
  },

  async exists(key) {
    try {
      await fsp.access(resolveKey(key), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  },

  createReadStream(key) {
    return fs.createReadStream(resolveKey(key));
  },

  async remove(key) {
    try {
      await fsp.unlink(resolveKey(key));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  },
};

export default localStorage;
