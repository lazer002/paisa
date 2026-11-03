// server/src/controllers/kioskController.js
//
// Attendance kiosks (see services/kiosk.js).
//   admins (geofence:create)   register / list / revoke kiosks
//   the kiosk screen (token)   GET /public/kiosk/:token → current code
//   staff (attendance:create)  POST /attendance/kiosk-check → in or out

import { Device } from "../models/Device.js";
import Organization from "../models/organization.js";
import {
  KIOSK_WINDOW_MS,
  hashKioskToken,
  isValidKioskCode,
  kioskCode,
  newKioskToken,
  windowOf,
} from "../services/kiosk.js";
import { recordSelfCheck, resolveTimezone, todaysStaffRecord } from "./attendanceController.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

const kioskView = (d) => ({
  publicId: d.publicId,
  name: d.name,
  status: d.status,
  lastSeenAt: d.lastSeenAt ?? null,
  createdAt: d.createdAt,
});

export const listKiosks = asyncHandler(async (req, res) => {
  const kiosks = await Device.find({
    instituteId: req.user.instituteId,
    deviceType: "kiosk",
    status: { $ne: "revoked" },
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

  return sendSuccess(res, { message: "Kiosks", data: kiosks.map(kioskView) });
});

/** Register a kiosk; the token (in the kiosk link) is shown only now. */
export const createKiosk = asyncHandler(async (req, res) => {
  if (!req.user.instituteId) throw ApiError.badRequest("Kiosks belong to an organization", "ORGANIZATION_REQUIRED");

  const token = newKioskToken();
  const kiosk = await Device.create({
    instituteId: req.user.instituteId,
    userId: req.user._id,
    registeredBy: req.user._id,
    name: String(req.body.name).trim(),
    deviceType: "kiosk",
    platform: "web",
    status: "active",
    deviceIdHash: hashKioskToken(token),
    // Required by the model; a kiosk has no browser fingerprint of its own.
    fingerprintHash: hashKioskToken(`fingerprint:${token}`),
    managedByOrganization: true,
    // Set when the kiosk screen first fetches a code.
    lastSeenAt: null,
  });

  return sendCreated(res, {
    message: "Kiosk registered. Open its link on the kiosk screen; the link is shown only once",
    data: { ...kioskView(kiosk), token, path: `/kiosk/${token}` },
  });
});

export const revokeKiosk = asyncHandler(async (req, res) => {
  const kiosk = await Device.findOneAndUpdate(
    { publicId: req.params.publicId, instituteId: req.user.instituteId, deviceType: "kiosk" },
    { $set: { status: "revoked", revokedAt: new Date(), revokedBy: req.user._id } },
    { new: true }
  );
  if (!kiosk) throw ApiError.notFound("Kiosk not found", "KIOSK_NOT_FOUND");

  return sendSuccess(res, { message: "Kiosk removed; its link stops working", data: kioskView(kiosk) });
});

/** Public, for the kiosk screen: its current code (token-authenticated). */
export const kioskDisplay = asyncHandler(async (req, res) => {
  const kiosk = await Device.findOne({
    deviceIdHash: hashKioskToken(req.params.token),
    deviceType: "kiosk",
    status: "active",
    isDeleted: { $ne: true },
  });

  if (!kiosk) throw ApiError.notFound("This kiosk link is not valid any more", "KIOSK_NOT_FOUND");

  const now = Date.now();
  await Device.updateOne({ _id: kiosk._id }, { $set: { lastSeenAt: new Date(now) } });
  const organization = await Organization.findById(kiosk.instituteId).select("name").lean();

  return sendSuccess(res, {
    message: "Kiosk code",
    data: {
      kioskId: kiosk.publicId,
      name: kiosk.name,
      organizationName: organization?.name ?? null,
      code: kioskCode(kiosk.publicId, windowOf(now)),
      refreshInMs: KIOSK_WINDOW_MS - (now % KIOSK_WINDOW_MS),
    },
  });
});

/** Staff scanned a kiosk: check in, or out if already in today. */
export const kioskCheck = asyncHandler(async (req, res) => {
  const kiosk = await Device.findOne({
    publicId: req.body.kioskId,
    instituteId: req.user.instituteId,
    deviceType: "kiosk",
    status: "active",
    isDeleted: { $ne: true },
  });

  if (!kiosk) throw ApiError.badRequest("This kiosk is not registered for your organization", "KIOSK_NOT_FOUND");

  if (!isValidKioskCode(kiosk.publicId, req.body.code)) {
    throw ApiError.badRequest("That code has expired. Scan the kiosk again", "KIOSK_CODE_EXPIRED");
  }

  const timezone = resolveTimezone(req.body.timezone);
  const today = await todaysStaffRecord(req.user, req.user.instituteId, timezone);
  const action = today?.checkIn && !today.checkOut ? "out" : "in";

  const record = await recordSelfCheck({
    user: req.user,
    instituteId: req.user.instituteId,
    timezone,
    action,
    markedVia: "qr",
    source: "kiosk",
  });

  return sendSuccess(res, {
    message: action === "out" ? `Checked out at ${kiosk.name}` : `Checked in at ${kiosk.name}`,
    data: { action, record },
  });
});
