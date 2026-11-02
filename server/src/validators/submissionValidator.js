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

// Either a web link (url) or a file uploaded via POST /files with purpose
// "submission" (fileId); the controller fills in the rest for uploads.
const attachment = Joi.object({
  name: optStr(255),
  url: url().invalid("", null),
  fileId: ref(),
  sizeBytes: int(0).max(100 * 1024 * 1024).allow(null),
  mimeType: optStr(150),
}).or("url", "fileId");

// submitAssignment: assignmentId + content are required (controller 400s
// without them); attachments are optional.
export const submitAssignmentSchema = Joi.object({
  assignmentId: ref().required(),
  content: Joi.string().trim().min(1).max(50000).required(),
  attachments: Joi.array().items(attachment).max(20).allow(null),
});

// gradeSubmission: a score, or points per rubric criterion (the controller
// checks them against the assignment's rubric and sums the score). The
// score is capped at the assignment's maxScore.
export const gradeSubmissionSchema = Joi.object({
  score: Joi.number().min(0),
  rubricScores: Joi.array()
    .items(
      Joi.object({
        criterion: Joi.string().trim().min(1).max(200).required(),
        points: Joi.number().min(0).required(),
        comment: optStr(2000),
      })
    )
    .min(1)
    .max(30),
  feedback: text(2000),
}).or("score", "rubricScores");
