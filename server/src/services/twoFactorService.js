// server/src/services/twoFactorService.js
//
// Two-factor sign-in with authenticator apps (TOTP, RFC 6238: SHA-1,
// 30-second steps, 6 digits) plus one-time recovery codes.
//
// - The secret is stored AES-256-GCM encrypted (key: TWO_FACTOR_ENCRYPTION_KEY,
//   else derived from JWT_REFRESH_SECRET), never returned after setup.
// - A code is accepted for the current step ±1 and never twice (lastStep).
// - Recovery codes are stored as sha256 hashes and removed when used.
// - Between password and code the client holds a short-lived signed
//   challenge token instead of a session.

import crypto from "node:crypto";

import env from "../config/env.js";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { encrypt, decrypt, hash } from "../utils/crypto.js";

const STEP_SECONDS = 30;
const DIGITS = 6;
const WINDOW = 1;
const RECOVERY_CODE_COUNT = 10;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const ISSUER = "PAISA";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/* =========================================================
   TOTP (pure, exported for tests)
========================================================= */

export const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let out = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];

  return out;
};

export const base32Decode = (text) => {
  const clean = String(text).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (const char of clean) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

export const timeStep = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/** The code for one time step (HOTP over the step counter). */
export const totpAt = (secretBase32, step, digits = DIGITS) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const digest = crypto
    .createHmac("sha1", base32Decode(secretBase32))
    .update(counter)
    .digest();

  const offset = digest[digest.length - 1] & 15;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 10 ** digits).padStart(digits, "0");
};

/** The matching step within ±WINDOW, or null. Codes after `afterStep` only. */
export const matchStep = (secretBase32, code, { now = Date.now(), afterStep = null } = {}) => {
  const clean = String(code ?? "").replace(/\s/g, "");

  if (!/^\d{6}$/.test(clean)) return null;

  const current = timeStep(now);

  for (let step = current - WINDOW; step <= current + WINDOW; step += 1) {
    if (afterStep !== null && step <= afterStep) continue;

    const expected = totpAt(secretBase32, step);

    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) {
      return step;
    }
  }

  return null;
};

export const otpauthUrl = (secretBase32, accountName) =>
  `otpauth://totp/${encodeURIComponent(`${ISSUER}:${accountName}`)}` +
  `?secret=${secretBase32}&issuer=${ISSUER}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;

/* =========================================================
   SECRET STORAGE
========================================================= */

const encryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(
      process.env.TWO_FACTOR_ENCRYPTION_KEY ||
        env.JWT_REFRESH_SECRET ||
        env.JWT_ACCESS_SECRET ||
        ""
    )
    .digest();

const seal = (secret) => JSON.stringify(encrypt(secret, encryptionKey()));
const unseal = (stored) => decrypt(JSON.parse(stored), encryptionKey());

const normalizeRecoveryCode = (code) =>
  String(code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const newRecoveryCodes = () =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = base32Encode(crypto.randomBytes(5)).slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });

const SECRET_FIELDS =
  "+twoFactorSecret +twoFactorPendingSecret +twoFactorRecoveryCodes +twoFactorLastStep";

const loadUser = (userId) => User.findById(userId).select(SECRET_FIELDS);

/* =========================================================
   CHALLENGE TOKEN (password accepted, code pending)
========================================================= */

const challengeKey = () =>
  crypto.createHash("sha256").update(`2fa-challenge:${env.JWT_ACCESS_SECRET || ""}`).digest();

export const createChallenge = (user, now = Date.now()) => {
  const body = Buffer.from(
    JSON.stringify({ sub: String(user._id), exp: now + CHALLENGE_TTL_MS })
  ).toString("base64url");

  const signature = crypto.createHmac("sha256", challengeKey()).update(body).digest("base64url");

  return `${body}.${signature}`;
};

export const readChallenge = (token, now = Date.now()) => {
  const [body, signature] = String(token ?? "").split(".");

  const expected = body
    ? crypto.createHmac("sha256", challengeKey()).update(body).digest("base64url")
    : "";

  if (
    !body ||
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw ApiError.unauthorized("Sign-in expired. Enter your password again", "TWO_FACTOR_CHALLENGE_INVALID");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

  if (!payload.exp || payload.exp < now) {
    throw ApiError.unauthorized("Sign-in expired. Enter your password again", "TWO_FACTOR_CHALLENGE_INVALID");
  }

  return payload.sub;
};

/* =========================================================
   VERIFY A CODE (authenticator or recovery)
========================================================= */

/**
 * Accepts a 6-digit authenticator code or a recovery code. Consumes what it
 * accepts (step recorded / recovery code removed). Throws on failure.
 */
export const verifySecondFactor = async (user, { code, recoveryCode }) => {
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw ApiError.badRequest("Two-factor sign-in is not enabled", "TWO_FACTOR_NOT_ENABLED");
  }

  if (recoveryCode) {
    const hashed = hash(normalizeRecoveryCode(recoveryCode));
    const remaining = (user.twoFactorRecoveryCodes ?? []).filter((h) => h !== hashed);

    if (remaining.length === (user.twoFactorRecoveryCodes ?? []).length) {
      throw ApiError.unauthorized("That recovery code is not valid", "TWO_FACTOR_CODE_INVALID");
    }

    user.twoFactorRecoveryCodes = remaining;
    await user.save();

    return { method: "recovery_code", recoveryCodesLeft: remaining.length };
  }

  const step = matchStep(unseal(user.twoFactorSecret), code, {
    afterStep: user.twoFactorLastStep ?? null,
  });

  if (step === null) {
    throw ApiError.unauthorized("That code is not valid. Check your authenticator app", "TWO_FACTOR_CODE_INVALID");
  }

  user.twoFactorLastStep = step;
  await user.save();

  return { method: "totp", recoveryCodesLeft: (user.twoFactorRecoveryCodes ?? []).length };
};

/* =========================================================
   SETUP / ENABLE / DISABLE
========================================================= */

export const getStatus = async (userId) => {
  const user = await loadUser(userId);

  return {
    enabled: Boolean(user?.twoFactorEnabled),
    enabledAt: user?.twoFactorEnabledAt ?? null,
    recoveryCodesLeft: user?.twoFactorEnabled ? (user.twoFactorRecoveryCodes ?? []).length : 0,
  };
};

/** Step 1: a fresh secret to scan. Not active until confirmed with a code. */
export const startSetup = async (userId) => {
  const user = await loadUser(userId);

  if (user.twoFactorEnabled) {
    throw ApiError.conflict("Two-factor sign-in is already on", "TWO_FACTOR_ALREADY_ENABLED");
  }

  const secret = base32Encode(crypto.randomBytes(20));

  user.twoFactorPendingSecret = seal(secret);
  await user.save();

  return {
    secret,
    otpauthUrl: otpauthUrl(secret, user.email),
  };
};

/** Step 2: the first valid code turns it on; returns recovery codes once. */
export const confirmSetup = async (userId, code) => {
  const user = await loadUser(userId);

  if (user.twoFactorEnabled) {
    throw ApiError.conflict("Two-factor sign-in is already on", "TWO_FACTOR_ALREADY_ENABLED");
  }

  if (!user.twoFactorPendingSecret) {
    throw ApiError.badRequest("Start the setup first", "TWO_FACTOR_SETUP_REQUIRED");
  }

  const secret = unseal(user.twoFactorPendingSecret);
  const step = matchStep(secret, code);

  if (step === null) {
    throw ApiError.badRequest("That code is not valid. Check the time on your phone and try again", "TWO_FACTOR_CODE_INVALID");
  }

  const recoveryCodes = newRecoveryCodes();

  user.twoFactorSecret = user.twoFactorPendingSecret;
  user.twoFactorPendingSecret = null;
  user.twoFactorEnabled = true;
  user.twoFactorEnabledAt = new Date();
  user.twoFactorLastStep = step;
  user.twoFactorRecoveryCodes = recoveryCodes.map((c) => hash(normalizeRecoveryCode(c)));
  await user.save();

  return { recoveryCodes };
};

/** Fresh recovery codes (the old ones stop working). Needs a current code. */
export const regenerateRecoveryCodes = async (userId, factor) => {
  const user = await loadUser(userId);

  await verifySecondFactor(user, factor);

  const recoveryCodes = newRecoveryCodes();
  user.twoFactorRecoveryCodes = recoveryCodes.map((c) => hash(normalizeRecoveryCode(c)));
  await user.save();

  return { recoveryCodes };
};

/** Turn it off: the owner proves a second factor; an admin reset skips that. */
export const disable = async (userId, factor = null) => {
  const user = await loadUser(userId);

  if (!user) {
    throw ApiError.notFound("User not found", "USER_NOT_FOUND");
  }

  if (factor) {
    await verifySecondFactor(user, factor);
  }

  user.twoFactorEnabled = false;
  user.twoFactorEnabledAt = null;
  user.twoFactorSecret = null;
  user.twoFactorPendingSecret = null;
  user.twoFactorRecoveryCodes = [];
  user.twoFactorLastStep = null;
  await user.save();

  return { enabled: false };
};

export { loadUser as loadUserWithSecrets };
