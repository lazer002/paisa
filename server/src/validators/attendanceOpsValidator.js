// server/src/validators/attendanceOpsValidator.js
//
// Body schemas for geofences and QR attendance sessions. Fields mirror what
// the controllers read; unknown keys pass through (see validators/common.js).

import {
  Joi,
  str,
  text,
  ref,
  int,
  optOneOf,
} from "./common.js";

import {
  GEOFENCE_STATUSES,
  GEOFENCE_TYPES,
} from "../models/Geofence.js";

const latitude = () => Joi.number().min(-90).max(90);
const longitude = () => Joi.number().min(-180).max(180);

const geofenceFields = {
  name: str(200),
  description: text(2000),
  type: optOneOf(GEOFENCE_TYPES),
  status: optOneOf(GEOFENCE_STATUSES),
  radiusMeters: Joi.number().min(1).max(100000).allow(null),
  latitude: latitude(),
  longitude: longitude(),
};

export const createGeofenceSchema = Joi.object({
  ...geofenceFields,
  name: geofenceFields.name.required(),
  latitude: geofenceFields.latitude.required(),
  longitude: geofenceFields.longitude.required(),
});

// The controller rebuilds the centre from both values, so they travel together.
export const updateGeofenceSchema = Joi.object(geofenceFields).and(
  "latitude",
  "longitude"
);

export const createQrSessionSchema = Joi.object({
  classId: ref().required(),
  // The controller clamps to 1..60; reject nonsense types/negatives early.
  minutes: int(1).max(1440).allow(null, ""),
});
