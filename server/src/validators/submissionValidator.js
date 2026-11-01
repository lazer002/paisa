// server/src/validators/submissionValidator.js
//
// Body schemas for /submissions (see validators/common.js for the policy).

import {
  Joi,
  int,
  optStr,
  ref,
  text,
  url,
} from "./common.js";

const attachment = Joi.object({
  name: optStr(255),
  url: url().invalid("", null).required(),
  sizeBytes: int(0).max(100 * 1024 * 1024).allow(null),
  mimeType: optStr(150),
});

// submitAssignment: assignmentId + content are required (controller 400s
// without them); attachments are optional.
export const submitAssignmentSchema = Joi.object({
  assignmentId: ref().required(),
  content: Joi.string().trim().min(1).max(50000).required(),
  attachments: Joi.array().items(attachment).max(20).allow(null),
});

// gradeSubmission: score is required; the controller caps it at the
// assignment's maxScore.
export const gradeSubmissionSchema = Joi.object({
  score: Joi.number().min(0).required(),
  feedback: text(2000),
});
