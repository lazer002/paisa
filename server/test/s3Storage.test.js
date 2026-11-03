import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";

const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

// ── A tiny path-style S3 that verifies every request's signature and
// payload hash. Started (and env set) before config/env.js is loaded,
// because the config object is frozen on first import.
const objects = new Map();
const seen = [];
let verify = null;

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const signed = /SignedHeaders=([^,]+)/.exec(req.headers.authorization ?? "")?.[1]?.split(";") ?? [];
  const expected = verify({
    method: req.method,
    url: `http://${req.headers.host}${req.url}`,
    headers: Object.fromEntries(signed.map((h) => [h, req.headers[h]])),
    region: "ap-south-1",
    accessKeyId: "AKIDTEST",
    secretAccessKey: "secret-test-key",
  });
  const hashOk = req.headers["x-amz-content-sha256"] === sha256(body);
  seen.push({ method: req.method, signatureOk: expected === req.headers.authorization, hashOk });

  if (expected !== req.headers.authorization || !hashOk) {
    res.writeHead(403).end("<Error><Code>SignatureDoesNotMatch</Code></Error>");
    return;
  }

  const key = req.url;
  if (req.method === "PUT") {
    objects.set(key, { body, type: req.headers["content-type"] });
    res.writeHead(200).end();
  } else if (req.method === "HEAD") {
    res.writeHead(objects.has(key) ? 200 : 404).end();
  } else if (req.method === "GET") {
    const o = objects.get(key);
    if (!o) res.writeHead(404).end("<Error><Code>NoSuchKey</Code></Error>");
    else res.writeHead(200, { "content-type": o.type }).end(o.body);
  } else if (req.method === "DELETE") {
    objects.delete(key);
    res.writeHead(204).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
server.unref();

Object.assign(process.env, {
  S3_BUCKET: "paisa-test",
  S3_REGION: "ap-south-1",
  S3_ACCESS_KEY_ID: "AKIDTEST",
  S3_SECRET_ACCESS_KEY: "secret-test-key",
  S3_ENDPOINT: `http://127.0.0.1:${server.address().port}`,
});

const { default: s3, signS3Request, s3ConfigFrom, objectUrl } = await import("../src/services/storage/s3Storage.js");
verify = signS3Request;

test("signature matches the AWS documentation example (GET object with Range)", () => {
  const authorization = signS3Request({
    method: "GET",
    url: "https://examplebucket.s3.amazonaws.com/test.txt",
    headers: {
      host: "examplebucket.s3.amazonaws.com",
      range: "bytes=0-9",
      "x-amz-content-sha256": sha256(""),
      "x-amz-date": "20130524T000000Z",
    },
    region: "us-east-1",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  });

  assert.equal(
    authorization,
    "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, " +
      "SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, " +
      "Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"
  );
});

test("save / exists / read / remove against an S3-compatible endpoint", async () => {
  const tenantId = "64b7f0c2a1b2c3d4e5f60718";
  const content = Buffer.from("hello from PAISA");
  const stored = await s3.save({ tenantId, buffer: content, ext: "txt", mimeType: "text/plain" });

  assert.match(stored.key, new RegExp(`^${tenantId}/\\d{4}/\\d{2}/[a-f0-9]{32}\\.txt$`));
  assert.equal(stored.size, content.length);
  assert.equal(stored.checksum, sha256(content));
  assert.ok(objects.has(`/paisa-test/${stored.key}`), "uploaded under /<bucket>/<key> (path-style)");
  assert.equal(objects.get(`/paisa-test/${stored.key}`).type, "text/plain");

  assert.equal(await s3.exists(stored.key), true);

  const read = [];
  for await (const chunk of s3.createReadStream(stored.key)) read.push(chunk);
  assert.equal(Buffer.concat(read).toString(), "hello from PAISA");

  await s3.remove(stored.key);
  assert.equal(await s3.exists(stored.key), false);
  await s3.remove(stored.key); // deleting twice is fine

  // A missing object surfaces as a stream error (the download route handles it).
  await assert.rejects(async () => {
    for await (const _ of s3.createReadStream(stored.key)) { /* drain */ }
  }, /S3 download failed: 404 NoSuchKey/);

  assert.ok(seen.length >= 7 && seen.every((s) => s.signatureOk && s.hashOk), JSON.stringify(seen));
});

test("unsafe keys are refused before any request", async () => {
  await assert.rejects(() => s3.exists("../../etc/passwd"), (e) => e.code === "STORAGE_KEY_INVALID");
});

test("missing settings are reported clearly; URLs follow the provider", () => {
  assert.throws(() => s3ConfigFrom({ S3_BUCKET: "b" }), (e) => e.code === "STORAGE_NOT_CONFIGURED");

  const aws = s3ConfigFrom({ S3_BUCKET: "b", S3_ACCESS_KEY_ID: "k", S3_SECRET_ACCESS_KEY: "s", S3_REGION: "ap-south-1" });
  assert.equal(objectUrl(aws, "x/y.pdf"), "https://b.s3.ap-south-1.amazonaws.com/x/y.pdf");

  const r2 = s3ConfigFrom({ S3_BUCKET: "b", S3_ACCESS_KEY_ID: "k", S3_SECRET_ACCESS_KEY: "s", S3_ENDPOINT: "https://acc.r2.cloudflarestorage.com/" });
  assert.equal(objectUrl(r2, "x/y.pdf"), "https://acc.r2.cloudflarestorage.com/b/x/y.pdf");
});
