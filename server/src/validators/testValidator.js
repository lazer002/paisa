// server/src/validators/testValidator.js
//
// Body schemas for tests, the question bank and test attempts. Fields mirror
// what testController reads; unknown keys pass through (validators/common.js).

import {
  Joi,
  str,
  optStr,
  text,
  ref,
  optRef,
  refList,
  optDate,
  optNum,
  oneOf,
  optOneOf,
} from "./common.js";

import {
  TEST_TYPES,
  TEST_MODES,
  TEST_STATUS,
} from "../models/Test.js";

import {
  QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_STATUS,
} from "../models/Question.js";

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

const testFields = {
  description: text(10000),
  instructions: text(10000),
  classId: optRef(),
  type: optOneOf(TEST_TYPES),
  mode: optOneOf(TEST_MODES),
  durationMinutes: optNum(0),
  startsAt: optDate(),
  endsAt: optDate(),
  totalPoints: optNum(0),
  passingScore: optNum(0),
  questionIds: refList(1000),
};

export const createTestSchema = Joi.object({
  ...testFields,
  title: str(300).required(),
});

export const updateTestSchema = Joi.object({
  ...testFields,
  title: str(300),
  status: oneOf(TEST_STATUS),
});

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

// The UI's "published" is stored as the model's "active".
const QUESTION_STATUS_INPUT = [
  ...QUESTION_STATUS,
  "published",
];

const option = Joi.object({
  text: Joi.string().max(2000).allow(""),
  isCorrect: Joi.boolean(),
  key: optStr(20),
});

const correctAnswer = Joi.alternatives()
  .try(
    Joi.string().max(5000).allow(""),
    Joi.number(),
    Joi.boolean()
  )
  .allow(null);

const questionFields = {
  title: optStr(300),
  difficulty: optOneOf(QUESTION_DIFFICULTIES),
  options: Joi.array().items(option).max(50).allow(null),
  correctAnswer,
  explanation: text(5000),
  points: optNum(0),
  subject: optStr(150),
  topic: optStr(150),
};

export const createQuestionSchema = Joi.object({
  ...questionFields,
  text: Joi.string().trim().min(1).max(10000).required(),
  type: oneOf(QUESTION_TYPES).required(),
  // Empty falls back to "draft" on create.
  status: optOneOf(QUESTION_STATUS_INPUT),
});

export const updateQuestionSchema = Joi.object({
  ...questionFields,
  text: Joi.string().trim().min(1).max(10000),
  type: oneOf(QUESTION_TYPES),
  status: oneOf(QUESTION_STATUS_INPUT),
});

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

export const submitAttemptSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: ref().required(),
        // Option text, free text, number, boolean or a list of picks.
        answer: Joi.any(),
      })
    )
    .max(1000),
});

export const gradeAttemptSchema = Joi.object({
  // Stored as-is, so it must be a real number when present.
  score: Joi.number().min(0),
  feedback: text(5000),
});

/* ------------------------------------------------------------------ */

export default Object.freeze({
  createTest: createTestSchema,
  updateTest: updateTestSchema,
  createQuestion: createQuestionSchema,
  updateQuestion: updateQuestionSchema,
  submitAttempt: submitAttemptSchema,
  gradeAttempt: gradeAttemptSchema,
});
