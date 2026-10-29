// server/src/controllers/geofenceController.js
//
// Circular geofences that restrict where self check-in is accepted.
// Tenant-scoped, soft-deleted, whitelisted fields only.

import { Geofence } from "../models/Geofence.js";

import { asyncHandler } from "../utils/errorHandler.js";

import ApiError from "../utils/ApiError.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
} from "../utils/response.js";

import {
  pickFields,
  tenantScope,
  requireInstitute,
} from "../utils/crudHelpers.js";

import { isValidCoordinate } from "../utils/geo.js";

const WRITABLE = [
  "name",
  "description",
  "type",
  "status",
  "radiusMeters",
];

// The client sends a flat { latitude, longitude }; the model keeps the
// point under `center`.
const buildCenter = (body) => {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!isValidCoordinate(latitude, longitude)) {
    throw ApiError.badRequest("A valid latitude and longitude are required");
  }

  return { latitude, longitude };
};

export const createGeofence = asyncHandler(async (req, res) => {
  const geofence = await Geofence.create({
    ...pickFields(req.body, WRITABLE),
    shapeType: "circle",
    center: buildCenter(req.body),
    status: req.body.status ?? "active",
    instituteId: requireInstitute(req),
    createdBy: req.user._id,
  });

  return sendCreated(res, {
    message: "Geofence created",
    data: geofence,
  });
});

export const getGeofences = asyncHandler(async (req, res) => {
  const geofences = await Geofence.find(tenantScope(req))
    .select("name type status shapeType center radiusMeters createdAt publicId")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Geofences fetched",
    data: geofences,
  });
});

export const updateGeofence = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!geofence) {
    return sendNotFound(res, "Geofence not found");
  }

  Object.assign(geofence, pickFields(req.body, WRITABLE));

  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    geofence.center = buildCenter(req.body);
  }

  await geofence.save();

  return sendSuccess(res, {
    message: "Geofence updated",
    data: geofence,
  });
});

export const deleteGeofence = asyncHandler(async (req, res) => {
  const geofence = await Geofence.findOne(
    tenantScope(req, { publicId: req.params.publicId })
  );

  if (!geofence) {
    return sendNotFound(res, "Geofence not found");
  }

  geofence.status = "archived";
  geofence.isDeleted = true;
  geofence.deletedAt = new Date();
  geofence.deletedBy = req.user._id;
  await geofence.save();

  return sendSuccess(res, { message: "Geofence deleted" });
});
