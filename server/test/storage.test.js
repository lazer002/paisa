import test from "node:test";
import assert from "node:assert/strict";

import {
  validateUpload,
  sanitizeOriginalName,
  assertSafeKey,
  MAX_FILE_SIZE_BYTES,
} from "../src/services/storage/fileRules.js";
import localStorage from "../src/services/storage/localStorage.js";

const PDF = Buffer.from("%PDF-1.4\n%test\n");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const EXE = Buffer.from("MZ\x90\x00binary");

const upload = (originalName, mimeType, buffer) =>
  validateUpload({ originalName, mimeType, size: buffer.length, buffer });

test("sanitizeOriginalName drops path parts and reserved characters", () => {
  assert.equal(sanitizeOriginalName("../../etc/passwd.pdf"), "passwd.pdf");
  assert.equal(sanitizeOriginalName("..\\..\\windows\\win.ini"), "win.ini");
  assert.equal(sanitizeOriginalName('a<b>:"c|?*.pdf'), "abc.pdf");
  assert.equal(sanitizeOriginalName("..."), "file");
  assert.equal(sanitizeOriginalName(""), "file");
});

test("allowed types pass with their canonical MIME type", () => {
  assert.deepEqual(upload("Report.PDF", "application/pdf", PDF), {
    ext: "pdf",
    mimeType: "application/pdf",
  });
  assert.deepEqual(upload("photo.png", "image/png", PNG), {
    ext: "png",
    mimeType: "image/png",
  });
  assert.equal(upload("data.csv", "application/vnd.ms-excel", Buffer.from("a,b\n1,2")).mimeType, "text/csv");
});

test("executables, MIME mismatches and fake content are rejected with 415", () => {
  assert.throws(() => upload("tool.exe", "application/octet-stream", EXE), { statusCode: 415 });
  assert.throws(() => upload("doc.pdf.exe", "application/pdf", PDF), { statusCode: 415 });
  assert.throws(() => upload("doc.pdf", "image/png", PDF), { statusCode: 415 });
  assert.throws(() => upload("fake.pdf", "application/pdf", EXE), { statusCode: 415 });
  assert.throws(() => upload("bin.txt", "text/plain", Buffer.from([0x41, 0x00, 0x42])), { statusCode: 415 });
});

test("oversize and empty files are rejected", () => {
  const big = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1);
  PDF.copy(big);
  assert.throws(() => upload("big.pdf", "application/pdf", big), { statusCode: 413 });
  assert.throws(() => upload("empty.pdf", "application/pdf", Buffer.alloc(0)), { statusCode: 400 });
});

test("storage keys must match the generated layout", () => {
  const good = "0123456789abcdef01234567/2026/11/0123456789abcdef0123456789abcdef.pdf";
  assert.equal(assertSafeKey(good), good);
  for (const bad of [
    "../secret.pdf",
    "0123456789abcdef01234567/../../x.pdf",
    "0123456789abcdef01234567/2026/11/..%2f.pdf",
    "/etc/passwd",
  ]) {
    assert.throws(() => assertSafeKey(bad));
    assert.throws(() => localStorage.createReadStream(bad));
  }
});
