import test from "node:test";
import assert from "node:assert/strict";

import {
  base32Encode,
  base32Decode,
  totpAt,
  matchStep,
  timeStep,
  otpauthUrl,
  createChallenge,
  readChallenge,
} from "../src/services/twoFactorService.js";

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));

test("base32 round-trips and matches the RFC 4648 alphabet", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
  assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
  assert.deepEqual(base32Decode("gezd gnbv"), base32Decode("GEZDGNBV"));
});

test("TOTP codes match the RFC 6238 test vectors", () => {
  const at = (seconds, digits) => totpAt(RFC_SECRET, Math.floor(seconds / 30), digits);

  assert.equal(at(59, 8), "94287082");
  assert.equal(at(1111111109, 8), "07081804");
  assert.equal(at(1234567890, 8), "89005924");
  assert.equal(at(2000000000, 8), "69279037");
  assert.equal(at(59, 6), "287082");
});

test("a code is accepted one step either side, not further", () => {
  const now = 1234567890 * 1000;
  const step = timeStep(now);

  assert.equal(matchStep(RFC_SECRET, totpAt(RFC_SECRET, step), { now }), step);
  assert.equal(matchStep(RFC_SECRET, totpAt(RFC_SECRET, step - 1), { now }), step - 1);
  assert.equal(matchStep(RFC_SECRET, totpAt(RFC_SECRET, step + 1), { now }), step + 1);
  assert.equal(matchStep(RFC_SECRET, totpAt(RFC_SECRET, step - 2), { now }), null);
});

test("a used step cannot be replayed; junk is rejected", () => {
  const now = 1234567890 * 1000;
  const step = timeStep(now);
  const code = totpAt(RFC_SECRET, step);

  assert.equal(matchStep(RFC_SECRET, code, { now, afterStep: step }), null);
  assert.equal(matchStep(RFC_SECRET, "12345", { now }), null);
  assert.equal(matchStep(RFC_SECRET, "abcdef", { now }), null);
  assert.equal(matchStep(RFC_SECRET, undefined, { now }), null);
  // Spaces typed between digit groups are fine.
  assert.equal(matchStep(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, { now }), step);
});

test("otpauth URL carries issuer, account and parameters", () => {
  const url = otpauthUrl("ABCDEF", "a@b.test");
  assert.match(url, /^otpauth:\/\/totp\/PAISA%3Aa%40b\.test\?secret=ABCDEF&issuer=PAISA/);
  assert.match(url, /digits=6&period=30/);
});

test("challenge tokens identify the user, expire and resist tampering", () => {
  const user = { _id: "507f1f77bcf86cd799439011" };
  const now = Date.UTC(2026, 10, 2);
  const token = createChallenge(user, now);

  assert.equal(readChallenge(token, now + 60_000), user._id);

  const code = (fn) => {
    try {
      fn();
    } catch (error) {
      return error.code;
    }
    return null;
  };

  assert.equal(code(() => readChallenge(token, now + 6 * 60_000)), "TWO_FACTOR_CHALLENGE_INVALID");

  const [body, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "someone-else", exp: now + 60_000 })).toString("base64url");
  assert.equal(code(() => readChallenge(`${forged}.${signature}`, now)), "TWO_FACTOR_CHALLENGE_INVALID");
  assert.equal(code(() => readChallenge(`${body}.x`, now)), "TWO_FACTOR_CHALLENGE_INVALID");
  assert.equal(code(() => readChallenge("", now)), "TWO_FACTOR_CHALLENGE_INVALID");
});
