// server/src/validators/attendanceValidator.js
//
// Body schemas for /api/attendance writes. Field lists mirror what
// attendanceController reads; unknown keys are allowed (and passed through)
// so existing clients keep working.

import Joi from "joi";

import { ATTENDANCE_STATUS } from "../models/Attendance.js";
import { bodyValidator } from "./leaveValidator.js";

const publicRef = Joi.string().trim().max(100);

// IANA name such as "Asia/Kolkata"; unknown names fall back to UTC.
const timezone = Joi.string().trim().max(64).allow(null, "");

export const markAttendanceSchema = Joi.object({
  classId: publicRef.allow(null, ""),
  date: Joi.date().required(),
  records: Joi.array()
    .items(
      Joi.object({
        userId: publicRef.required(),
        status: Joi.string().valid(...ATTENDANCE_STATUS).required(),
        notes: Joi.string().trim().max(500).allow(null, ""),
      }).unknown(true)
    )
    .required(),
});

export const selfCheckSchema = Joi.object({
  action: Joi.string().valid("in", "out").required(),
  // Required by the controller only when the org has a check-in area.
  latitude: Joi.number().min(-90).max(90).allow(null, ""),
  longitude: Joi.number().min(-180).max(180).allow(null, ""),
  accuracy: Joi.number().min(0).allow(null, ""),
  timezone,
});

export const qrScanSchema = Joi.object({
  code: Joi.string().trim().min(1).max(32).required(),
  timezone,
});

export const kioskCheckSchema = Joi.object({
  kioskId: Joi.string().trim().max(100).required(),
  code: Joi.string().trim().length(8).required(),
  timezone,
});

export const createKioskSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

export const validateMarkAttendance = bodyValidator(markAttendanceSchema);
export const validateKioskCheck = bodyValidator(kioskCheckSchema);
export const validateCreateKiosk = bodyValidator(createKioskSchema);
export const validateSelfCheck = bodyValidator(selfCheckSchema);
export const validateQrScan = bodyValidator(qrScanSchema);
