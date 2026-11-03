// server/src/services/kiosk.js
//
// Attendance kiosks: a registered screen (Device, type "kiosk") shows a QR
// whose code changes every 30 seconds. Staff scan it with their signed-in
// phone to check in / out — being in front of the kiosk is the proof of
// presence, so no location is needed, and an old photo of the code expires.
// The kiosk itself authenticates with a secret token (only its hash is kept).

import crypto from "node:crypto";

import env from "../config/env.js";

export const KIOSK_WINDOW_MS = 30 * 1000;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const secret = () =>
  crypto.createHash("sha256").update(`kiosk:${env.JWT_ACCESS_SECRET || ""}`).digest();

export const hashKioskToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

export const newKioskToken = () => crypto.randomBytes(24).toString("base64url");

export const windowOf = (now = Date.now()) => Math.floor(now / KIOSK_WINDOW_MS);

/** The 8-character code a kiosk shows during one time window. */
export const kioskCode = (kioskPublicId, window) => {
  const digest = crypto.createHmac("sha256", secret()).update(`${kioskPublicId}:${window}`).digest();
  return Array.from(digest.subarray(0, 8), (b) => ALPHABET[b % ALPHABET.length]).join("");
};

/** A code is good for its own window and the one before (scan + network delay). */
export const isValidKioskCode = (kioskPublicId, code, now = Date.now()) => {
  const clean = String(code ?? "").toUpperCase();
  if (clean.length !== 8) return false;

  const current = windowOf(now);
  return [current, current - 1].some((w) => {
    const expected = kioskCode(kioskPublicId, w);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean));
  });
};
