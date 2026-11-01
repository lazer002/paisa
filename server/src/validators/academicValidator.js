// server/src/validators/academicValidator.js
//
// Body schemas for classes, enrollments, assignments, study materials and
// live sessions. Fields mirror what the controllers read; unknown keys pass
// through untouched (see validators/common.js).

import {
  Joi,
  str,
  optStr,
  text,
  ref,
  optRef,
  optDate,
  isoDate,
  time,
  int,
  optInt,
  optNum,
  oneOf,
  optOneOf,
} from "./common.js";

import { CLASS_STATUS } from "../models/Class.js";
import { ASSIGNMENT_STATUS } from "../models/Assignment.js";
import {
  ENROLLMENT_STATUS,
  ENROLLMENT_TYPES,
} from "../models/Enrollment.js";
import {
  LIVE_SESSION_STATUS,
  ACCESS_MODES,
} from "../models/LiveSession.js";

// Kept in sync with the Class / StudyMaterial / Assignment model enums
// (these lists are not exported by the models).
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MATERIAL_TYPES = [
  "pdf",
  "video",
  "document",
  "link",
  "image",
  "presentation",
  "audio",
  "other",
];

const MATERIAL_VISIBILITIES = [
  "class_only",
  "institute",
  "public",
];

const ATTACHMENT_TYPES = [
  "document",
  "image",
  "video",
  "audio",
  "link",
  "other",
];

/* ------------------------------------------------------------------ */
/* Classes                                                             */
/* ------------------------------------------------------------------ */

const schedule = Joi.object({
  days: Joi.array().items(oneOf(DAYS)).max(7),
  startTime: time(),
  endTime: time(),
  timezone: optStr(100),
  room: optStr(100),
}).allow(null);

const classFields = {
  description: text(5000),
  teacherId: optRef(),
  schedule,
  room: optStr(100),
  maxStudents: optInt(0),
};

export const createClassSchema = Joi.object({
  ...classFields,
  name: str(200).required(),
  subject: str(200).required(),
  code: optStr(50),
});

export const updateClassSchema = Joi.object({
  ...classFields,
  name: str(200),
  subject: str(200),
  status: oneOf(CLASS_STATUS),
});

export const enrollStudentSchema = Joi.object({
  studentId: ref().required(),
});

/* ------------------------------------------------------------------ */
/* Enrollments                                                         */
/* ------------------------------------------------------------------ */

export const createEnrollmentSchema = Joi.object({
  studentId: ref().required(),
  classId: optRef(),
  type: optOneOf(ENROLLMENT_TYPES),
  enrollmentNumber: optStr(100),
});

export const updateEnrollmentStatusSchema = Joi.object({
  status: oneOf(ENROLLMENT_STATUS).required(),
});

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

const attachment = Joi.object({
  type: optOneOf(ATTACHMENT_TYPES),
  name: str(255).required(),
  url: str(2048).required(),
  sizeBytes: optNum(0),
  mimeType: optStr(150),
});

const assignmentFields = {
  description: text(10000),
  instructions: text(10000),
  dueDate: optDate(),
  maxScore: optNum(0),
  attachments: Joi.array().items(attachment).max(50).allow(null),
};

export const createAssignmentSchema = Joi.object({
  ...assignmentFields,
  classId: ref().required(),
  title: str(300).required(),
});

export const updateAssignmentSchema = Joi.object({
  ...assignmentFields,
  title: str(300),
  status: oneOf(ASSIGNMENT_STATUS),
});

/* ------------------------------------------------------------------ */
/* Study materials                                                     */
/* ------------------------------------------------------------------ */

const materialFields = {
  description: text(2000),
  classId: optRef(),
  subject: optStr(150),
  type: optOneOf(MATERIAL_TYPES),
  fileSize: optNum(0),
  visibility: oneOf(MATERIAL_VISIBILITIES),
};

export const createStudyMaterialSchema = Joi.object({
  ...materialFields,
  title: str(200).required(),
  url: str(2048).required(),
});

export const updateStudyMaterialSchema = Joi.object({
  ...materialFields,
  title: str(200),
  url: str(2048),
});

/* ------------------------------------------------------------------ */
/* Live sessions                                                       */
/* ------------------------------------------------------------------ */

const liveSessionFields = {
  description: text(5000),
  classId: optRef(),
  // Free text: people paste meeting links with or without a scheme.
  joinUrl: optStr(2048),
  scheduledEndAt: optDate(),
  accessMode: optOneOf(ACCESS_MODES),
};

export const createLiveSessionSchema = Joi.object({
  ...liveSessionFields,
  title: str(200).required(),
  scheduledStartAt: isoDate().required(),
});

export const updateLiveSessionSchema = Joi.object({
  ...liveSessionFields,
  title: str(200),
  scheduledStartAt: isoDate(),
  status: oneOf(LIVE_SESSION_STATUS),
});

/* ------------------------------------------------------------------ */

export default Object.freeze({
  createClass: createClassSchema,
  updateClass: updateClassSchema,
  enrollStudent: enrollStudentSchema,
  createEnrollment: createEnrollmentSchema,
  updateEnrollmentStatus: updateEnrollmentStatusSchema,
  createAssignment: createAssignmentSchema,
  updateAssignment: updateAssignmentSchema,
  createStudyMaterial: createStudyMaterialSchema,
  updateStudyMaterial: updateStudyMaterialSchema,
  createLiveSession: createLiveSessionSchema,
  updateLiveSession: updateLiveSessionSchema,
});
