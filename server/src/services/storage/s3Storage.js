// server/src/services/storage/s3Storage.js
//
// S3-compatible provider (STORAGE_PROVIDER=s3): AWS S3, Cloudflare R2, MinIO,
// DigitalOcean Spaces… Requests are signed with AWS Signature V4 using
// node:crypto (no AWS SDK). Same interface and key layout as localStorage.js:
//
//   save({ tenantId, buffer, ext, mimeType }) -> { key, size, checksum }
//   exists(key) -> boolean
//   createReadStream(key) -> Readable
//   remove(key) -> void
//
// The bucket stays private; downloads keep flowing through
// GET /api/files/:id/download (the app checks access, then streams).
//
// Config (config/env.js): S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID,
// S3_SECRET_ACCESS_KEY, optional S3_ENDPOINT. Without an endpoint the AWS
// virtual-hosted URL is used; with one (R2, MinIO…) path-style URLs.

import crypto from "node:crypto";
import { PassThrough, Readable } from "node:stream";

import env from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { assertSafeKey } from "./fileRules.js";

const EMPTY_SHA256 = crypto.createHash("sha256").update("").digest("hex");

const sha256Hex = (data) => crypto.createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();

/** AWS URI encoding of a path, keeping "/" (S3 keys are not double-encoded). */
const encodePath = (pathname) =>
  pathname
    .split("/")
    .map((segment) =>
      encodeURIComponent(decodeURIComponent(segment)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    )
    .join("/");

/**
 * AWS Signature V4 for one S3 request. `headers` must include host,
 * x-amz-date and x-amz-content-sha256; every header given is signed.
 * Returns the Authorization header value. Exported for tests.
 */
export const signS3Request = ({ method, url, headers, region, accessKeyId, secretAccessKey }) => {
  const u = new URL(url);
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const signedHeaders = Object.keys(lower).sort();

  const canonicalQuery = [...u.searchParams.entries()]
    .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [
    method,
    encodePath(u.pathname || "/"),
    canonicalQuery,
    signedHeaders.map((h) => `${h}:${lower[h]}\n`).join(""),
    signedHeaders.join(";"),
    lower["x-amz-content-sha256"],
  ].join("\n");

  const amzDate = lower["x-amz-date"];
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(";")}, Signature=${signature}`;
};

/** S3 settings from a config source (config/env.js); throws when incomplete. */
export const s3ConfigFrom = (source) => {
  const c = {
    bucket: source.S3_BUCKET,
    region: source.S3_REGION || "us-east-1",
    endpoint: source.S3_ENDPOINT ? source.S3_ENDPOINT.replace(/\/+$/, "") : null,
    accessKeyId: source.S3_ACCESS_KEY_ID,
    secretAccessKey: source.S3_SECRET_ACCESS_KEY,
  };

  if (!c.bucket || !c.accessKeyId || !c.secretAccessKey) {
    throw ApiError.internal("S3 storage is selected but S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set", {
      code: "STORAGE_NOT_CONFIGURED",
    });
  }

  return c;
};

const config = () => s3ConfigFrom(env);

/** Object URL: path-style on a custom endpoint, virtual-hosted on AWS. */
export const objectUrl = (c, key) =>
  c.endpoint
    ? `${c.endpoint}/${c.bucket}/${key}`
    : `https://${c.bucket}.s3.${c.region}.amazonaws.com/${key}`;

const amzDateNow = () => new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

/** Signed fetch to one object. */
const request = async (method, key, { body = null, contentType = null } = {}) => {
  assertSafeKey(key);
  const c = config();
  const url = objectUrl(c, key);

  const headers = {
    host: new URL(url).host,
    "x-amz-date": amzDateNow(),
    "x-amz-content-sha256": body ? sha256Hex(body) : EMPTY_SHA256,
    ...(contentType ? { "content-type": contentType } : {}),
  };

  const authorization = signS3Request({ method, url, headers, region: c.region, accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey });

  const { host: _host, ...sendHeaders } = headers; // fetch sets Host itself
  return fetch(url, { method, headers: { ...sendHeaders, authorization }, body: body ?? undefined });
};

const failure = async (operation, response) => {
  const text = await response.text().catch(() => "");
  const code = text.match(/<Code>([^<]+)<\/Code>/)?.[1];
  return new Error(`S3 ${operation} failed: ${response.status}${code ? ` ${code}` : ""}`);
};

const buildKey = (tenantId, ext) => {
  const tenant = String(tenantId ?? "");
  if (!/^[a-f0-9]{24}$/.test(tenant)) throw new Error("A tenant id is required to store a file");

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${tenant}/${yyyy}/${mm}/${crypto.randomBytes(16).toString("hex")}.${ext}`;
};

const s3Storage = {
  name: "s3",

  async save({ tenantId, buffer, ext, mimeType }) {
    const key = buildKey(tenantId, ext);
    const response = await request("PUT", key, { body: buffer, contentType: mimeType || "application/octet-stream" });

    if (!response.ok) throw await failure("upload", response);

    return {
      key,
      size: buffer.length,
      checksum: sha256Hex(buffer),
    };
  },

  async exists(key) {
    const response = await request("HEAD", key);
    if (response.ok) return true;
    if (response.status === 404) return false;
    throw await failure("lookup", response);
  },

  // Synchronous like fs.createReadStream: the download starts in the
  // background and errors surface as stream "error" events.
  createReadStream(key) {
    const out = new PassThrough();

    request("GET", key)
      .then(async (response) => {
        if (!response.ok || !response.body) throw await failure("download", response);
        Readable.fromWeb(response.body).on("error", (e) => out.destroy(e)).pipe(out);
      })
      .catch((error) => out.destroy(error));

    return out;
  },

  async remove(key) {
    const response = await request("DELETE", key);
    if (!response.ok && response.status !== 404) throw await failure("delete", response);
  },
};

export default s3Storage;
