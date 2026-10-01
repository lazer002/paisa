// server/src/controllers/testController.js
//
// Assessment module: Tests + Questions + Test Attempts.
//
// Lifecycle: admin/teacher drafts a Test, attaches Questions, publishes it;
// students start Attempts, submit answers, and graders finalize scores.
// Every query is tenant-scoped; super_admin sees across organizations.

import { Test } from "../models/Test.js";
import { Question } from "../models/Question.js";
import { TestAttempt } from "../models/TestAttempt.js";
import { Class } from "../models/Class.js";

import { asyncHandler } from "../utils/errorHandler.js";

import { resolveRef } from "../utils/resolveRef.js";

import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendForbidden,
  sendError,
} from "../utils/response.js";

/* =========================================================
   TENANT SCOPE
========================================================= */

const scoped = (req, extra = {}) => {
  if (req.user.role === "super_admin") {
    return { ...extra };
  }

  return {
    instituteId: req.user.instituteId,
    ...extra,
  };
};

const assertTenantRow = (req, row) => {
  if (
    req.user.role !== "super_admin" &&
    String(row.instituteId) !==
      String(req.user.instituteId)
  ) {
    throwForbidden();
  }
};

const throwForbidden = () =>
  sendForbiddenDirect();

// response.js helpers terminate the request,
// but assertion sites need a thrown path —
// the asyncHandler forwards it to errorHandler.
import ApiError from "../utils/ApiError.js";

const forbidden = () =>
  ApiError.forbidden("Access denied", "ACCESS_DENIED");

const sendForbiddenDirect = () => {
  throw ApiError.forbidden(
    "Access denied",
    "ACCESS_DENIED"
  );
};

/* =========================================================
   TESTS
========================================================= */

export const createTest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructions,
    classId,
    type,
    mode,
    durationMinutes,
    startsAt,
    endsAt,
    totalPoints,
    passingScore,
    questionIds,
  } = req.body;

  if (!title) {
    return sendError(res, 400, "Title is required");
  }

  const resolvedClassId = classId
    ? await resolveRef(Class, classId, { label: "Class" })
    : null;

  // Teachers may only attach their own classes.
  if (
    resolvedClassId &&
    req.user.role === "teacher"
  ) {
    const cls = await Class.findById(resolvedClassId);

    if (
      !cls ||
      String(cls.teacherId) !==
        String(req.user._id)
    ) {
      return nextForbidden(res);
    }
  }

  // Resolve question references (publicIds) and
  // keep only questions from this tenant.
  const resolvedQuestionIds = [];

  for (const questionId of questionIds || []) {
    resolvedQuestionIds.push(
      await resolveRef(Question, questionId, {
        label: "Question",
      })
    );
  }

  const test = await Test.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    title,
    description,
    instructions,

    classId: resolvedClassId,

    type: type || "quiz",
    mode: mode || "online",

    schedule: {
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      durationMinutes: durationMinutes || 30,
    },

    grading: {
      totalPoints: totalPoints || 100,
      passingScore: passingScore || 40,
    },

    questionIds: resolvedQuestionIds,

    status: "draft",
  });

  return sendCreated(res, {
    message: "Test created",
    data: test,
  });
});

const nextForbidden = (res) =>
  sendForbidden(res, "Access denied");

export const getTests = asyncHandler(async (req, res) => {
  const { status, classId, search } = req.query;

  const query = scoped(req);

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  }

  if (req.user.role === "student") {
    const enrolledClasses = await Class.find({
      studentIds: req.user._id,
    }).select("_id");

    query.classId = {
      $in: enrolledClasses.map((c) => c._id),
    };
    query.status = {
      $in: ["published", "live", "completed"],
    };
  }

  if (status) {
    query.status = status;
  }

  if (classId) {
    query.classId = await resolveRef(
      Class,
      classId,
      { label: "Class" }
    );
  }

  if (search) {
    query.title = {
      $regex: search,
      $options: "i",
    };
  }

  const tests = await Test.find(query)
    .populate("classId", "name subject")
    .populate("createdBy", "name email")
    .populate("questionIds", "text type points")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Tests fetched",
    data: tests,
  });
});

export const getTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  })
    .populate("classId", "name subject")
    .populate("createdBy", "name email")
    .populate("questionIds");

  if (!test) {
    return sendNotFound(res, "Test not found");
  }

  return sendSuccess(res, {
    message: "Test fetched",
    data: test,
  });
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    publicId: req.params.publicId,
  });

  if (!test) {
    return sendNotFound(res, "Test not found");
  }

  assertTenantRow(req, test);

  if (
    req.user.role === "teacher" &&
    String(test.createdBy) !== String(req.user._id)
  ) {
    throw forbidden();
  }

  const allowed = [
    "title",
    "description",
    "instructions",
    "type",
    "mode",
    "status",
  ];

  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.body.durationMinutes !== undefined) {
    updates["schedule.durationMinutes"] =
      req.body.durationMinutes;
  }

  if (req.body.startsAt !== undefined) {
    updates["schedule.startsAt"] =
      req.body.startsAt;
  }

  if (req.body.endsAt !== undefined) {
    updates["schedule.endsAt"] = req.body.endsAt;
  }

  if (req.body.totalPoints !== undefined) {
    updates["grading.totalPoints"] =
      req.body.totalPoints;
  }

  if (req.body.passingScore !== undefined) {
    updates["grading.passingScore"] =
      req.body.passingScore;
  }

  if (req.body.classId !== undefined) {
    updates.classId = req.body.classId
      ? await resolveRef(Class, req.body.classId, {
          label: "Class",
        })
      : null;
  }

  if (req.body.questionIds !== undefined) {
    const resolved = [];

    for (const questionId of req.body.questionIds) {
      resolved.push(
        await resolveRef(Question, questionId, {
          label: "Question",
        })
      );
    }

    updates.questionIds = resolved;
  }

  updates.updatedBy = req.user._id;

  const updated = await Test.findOneAndUpdate(
    { publicId: req.params.publicId },
    updates,
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    message: "Test updated",
    data: updated,
  });
});

export const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    publicId: req.params.publicId,
  });

  if (!test) {
    return sendNotFound(res, "Test not found");
  }

  assertTenantRow(req, test);

  await test.deleteOne();

  return sendSuccess(res, {
    message: "Test deleted",
    data: null,
  });
});

/* =========================================================
   QUESTIONS
========================================================= */

export const createQuestion = asyncHandler(async (req, res) => {
  const {
    text,
    title,
    type,
    difficulty,
    options,
    correctAnswer,
    explanation,
    points,
    subject,
    topic,
    status,
  } = req.body;

  if (!text || !type) {
    return sendError(res, 400, "Text and type are required");
  }

  const question = await Question.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    text,
    title: title || null,
    type,
    difficulty: difficulty || "medium",
    status: status || "draft",

    options: options || [],
    correctAnswer: correctAnswer || null,
    explanation: explanation || null,

    points: points || 1,

    subject: subject || null,
    topic: topic || null,
  });

  return sendCreated(res, {
    message: "Question created",
    data: question,
  });
});

export const getQuestions = asyncHandler(async (req, res) => {
  const { type, difficulty, status, subject, search } =
    req.query;

  const query = scoped(req);

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  }

  if (type) query.type = type;
  if (difficulty) query.difficulty = difficulty;
  if (status) query.status = status;
  if (subject) query.subject = subject;

  if (search) {
    query.text = { $regex: search, $options: "i" };
  }

  const questions = await Question.find(query)
    .select("-correctAnswer")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Questions fetched",
    data: questions,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findOne({
    publicId: req.params.publicId,
  });

  if (!question) {
    return sendNotFound(res, "Question not found");
  }

  assertTenantRow(req, question);

  if (
    req.user.role === "teacher" &&
    String(question.createdBy) !==
      String(req.user._id)
  ) {
    throw forbidden();
  }

  const allowed = [
    "text",
    "title",
    "type",
    "difficulty",
    "options",
    "correctAnswer",
    "explanation",
    "points",
    "subject",
    "topic",
    "status",
  ];

  const updates = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  updates.updatedBy = req.user._id;

  const updated =
    await Question.findOneAndUpdate(
      { publicId: req.params.publicId },
      updates,
      { new: true, runValidators: true }
    );

  return sendSuccess(res, {
    message: "Question updated",
    data: updated,
  });
});

export const deleteQuestion = asyncHandler(
  async (req, res) => {
    const question = await Question.findOne({
      publicId: req.params.publicId,
    });

    if (!question) {
      return sendNotFound(res, "Question not found");
    }

    assertTenantRow(req, question);

    await question.deleteOne();

    return sendSuccess(res, {
      message: "Question deleted",
      data: null,
    });
  }
);

/* =========================================================
   ATTEMPTS
========================================================= */

export const startAttempt = asyncHandler(async (req, res) => {
  const test = await Test.findOne({
    publicId: req.params.publicId,
    ...scoped(req),
  });

  if (!test) {
    return sendNotFound(res, "Test not found");
  }

  if (
    !["published", "live"].includes(test.status)
  ) {
    return sendError(
      res,
      400,
      "Test is not open for attempts"
    );
  }

  const existing = await TestAttempt.findOne({
    testId: test._id,
    studentId: req.user._id,
    status: { $nin: ["abandoned", "expired"] },
  });

  if (existing) {
    return sendSuccess(res, {
      message: "Attempt already in progress",
      data: existing,
    });
  }

  const lastAttempt = await TestAttempt.findOne({
    testId: test._id,
    studentId: req.user._id,
  }).sort({ attemptNumber: -1 });

  const attempt = await TestAttempt.create({
    instituteId: req.user.instituteId,

    testId: test._id,

    studentId: req.user._id,

    classId: test.classId || null,

    attemptNumber:
      (lastAttempt?.attemptNumber || 0) + 1,

    status: "in_progress",
  });

  return sendCreated(res, {
    message: "Attempt started",
    data: attempt,
  });
});

export const getAttempts = asyncHandler(async (req, res) => {
  const { testId, status } = req.query;

  const query = scoped(req);

  if (req.user.role === "student") {
    query.studentId = req.user._id;
  }

  if (testId) {
    query.testId = await resolveRef(
      Test,
      testId,
      { label: "Test" }
    );
  }

  if (status) {
    query.status = status;
  }

  const attempts = await TestAttempt.find(query)
    .populate("testId", "title grading.status")
    .populate("studentId", "name email userCode")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Attempts fetched",
    data: attempts,
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { answers } = req.body;

  const attempt = await TestAttempt.findOne({
    publicId: req.params.publicId,
  });

  if (!attempt) {
    return sendNotFound(res, "Attempt not found");
  }

  const isOwner =
    String(attempt.studentId) ===
    String(req.user._id);

  if (!isOwner) {
    throw forbidden();
  }

  if (attempt.status !== "in_progress") {
    return sendError(
      res,
      400,
      "Attempt is not active"
    );
  }

  // Auto-grade objective answers.
  const test = await Test.findById(
    attempt.testId
  ).populate("questionIds");

  let earned = 0;
  let total = 0;

  const gradedAnswers = [];

  for (const question of test.questionIds || []) {
    total += question.points || 1;

    const given = (answers || []).find(
      (a) =>
        a.questionId === question.publicId ||
        String(a.questionId) ===
          String(question._id)
    );

    const isObjective = [
      "single_choice",
      "multiple_choice",
      "true_false",
      "numeric",
      "fill_blank",
    ].includes(question.type);

    const isCorrect =
      given &&
      isObjective &&
      String(
        given.answer ?? ""
      ).toLowerCase() ===
        String(
          question.correctAnswer ?? ""
        ).toLowerCase();

    if (isCorrect) {
      earned += question.points || 1;
    }

    gradedAnswers.push({
      questionId: question._id,

      answer: given?.answer ?? null,

      isCorrect,

      awardedPoints: isCorrect
        ? question.points || 1
        : 0,

      status: isObjective
        ? "graded"
        : "pending_review",
    });
  }

  const hasPendingReview = gradedAnswers.some(
    (a) => a.status === "pending_review"
  );

  attempt.answers = gradedAnswers;
  attempt.status = hasPendingReview
    ? "submitted"
    : "graded";

  attempt.score = {
    earned,
    total,
    percentage: total
      ? Math.round((earned / total) * 100)
      : 0,
    passed: test.grading?.passingScore !== undefined
      ? earned >= test.grading.passingScore
      : null,
  };

  attempt.submittedAt = new Date();

  await attempt.save();

  return sendSuccess(res, {
    message: "Attempt submitted",
    data: attempt,
  });
});

export const gradeAttempt = asyncHandler(async (req, res) => {
  const { score, feedback } = req.body;

  const attempt = await TestAttempt.findOne({
    publicId: req.params.publicId,
  });

  if (!attempt) {
    return sendNotFound(res, "Attempt not found");
  }

  assertTenantRow(req, attempt);

  if (
    req.user.role === "teacher" &&
    String(attempt.createdBy) !==
      String(req.user._id)
  ) {
    throw forbidden();
  }

  if (score !== undefined) {
    attempt.score = {
      ...attempt.score,
      earned: score,
      percentage: attempt.score?.total
        ? Math.round(
            (score / attempt.score.total) * 100
          )
        : attempt.score?.percentage ?? 0,
    };
  }

  if (feedback !== undefined) {
    attempt.feedback = feedback;
  }

  attempt.status = "graded";

  attempt.gradedBy = req.user._id;

  attempt.gradedAt = new Date();

  await attempt.save();

  return sendSuccess(res, {
    message: "Attempt graded",
    data: attempt,
  });
});
