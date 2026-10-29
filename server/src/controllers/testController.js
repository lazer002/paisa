// server/src/controllers/testController.js
//
// Assessment module: Tests + Questions + Test Attempts.
//
// Lifecycle: admin/teacher drafts a Test, attaches Questions, publishes it;
// students start Attempts, submit answers, and graders finalize scores.
// Every query is tenant-scoped; super_admin sees across organizations.

import { Test } from "../models/Test.js";
import { visibleClassIdsFor } from "../utils/parentScope.js";
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

  // Parents only ever see tests that were released to students.
  if (req.user.role === "parent") {
    query.classId = {
      $in: await visibleClassIdsFor(req.user),
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
    .populate("questionIds", "text type marks")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Tests fetched",
    data: tests,
  });
});

// Students and parents only see tests of classes they (or their
// children) are enrolled in. Everyone else is limited by tenant only.
const canSeeTestClass = async (user, test) => {
  const visibleClasses = await visibleClassIdsFor(user);

  if (!visibleClasses) return true;

  return visibleClasses.some(
    (id) =>
      String(id) === String(test.classId?._id ?? test.classId)
  );
};

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

  if (!(await canSeeTestClass(req.user, test))) {
    return sendNotFound(res, "Test not found");
  }

  // Never ship the answer key to people who take (or watch) the test.
  if (["student", "parent"].includes(req.user.role)) {
    if (
      !["published", "live", "completed"].includes(
        test.status
      )
    ) {
      return sendNotFound(res, "Test not found");
    }

    const safe = test.toObject();

    safe.questionIds = (safe.questionIds || []).map(
      ({ answer, correctAnswer, explanation, ...question }) => ({
        ...question,
        options: (question.options || []).map(
          ({ isCorrect, ...option }) => option
        ),
      })
    );

    return sendSuccess(res, {
      message: "Test fetched",
      data: safe,
    });
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

// ── Question <-> API mapping ──────────────────────────────────────────────
// The Question model stores `marks` and an `answer` object; the web client
// (and older callers) speak `points` and a plain `correctAnswer`.

const OPTION_TYPES = ["single_choice", "multiple_choice"];

const buildAnswer = (type, options, correctAnswer) => {
  if (OPTION_TYPES.includes(type)) {
    return {
      type: type === "single_choice" ? "option" : "options",
      acceptedOptions: options
        .filter((option) => option.isCorrect)
        .map((option) => option.key),
    };
  }

  if (correctAnswer === undefined || correctAnswer === null || correctAnswer === "") {
    return undefined;
  }

  if (type === "numeric") {
    const value = Number(correctAnswer);

    return {
      type: "numeric",
      acceptedValues: [String(correctAnswer)],
      numericRange: { min: value, max: value },
    };
  }

  return {
    type: type === "true_false" ? "boolean" : "text",
    acceptedValues: [String(correctAnswer)],
    caseSensitive: false,
    trimWhitespace: true,
  };
};

// The text a person would have to give to be right (for the staff view).
const correctAnswerOf = (question) => {
  if (OPTION_TYPES.includes(question.type)) {
    return (
      (question.options || [])
        .filter((option) => option.isCorrect)
        .map((option) => option.text)
        .join(", ") || null
    );
  }

  return question.answer?.acceptedValues?.[0] ?? null;
};

const questionView = (question) => {
  const plain = question.toObject ? question.toObject() : question;

  return {
    ...plain,
    points: plain.marks ?? 1,
    correctAnswer: correctAnswerOf(plain),
  };
};

const isAnswerCorrect = (question, given) => {
  if (given === undefined || given === null || given === "") return false;

  if (question.type === "single_choice") {
    const option = (question.options || []).find(
      (item) => item.text === given || item.key === given
    );

    return Boolean(option?.isCorrect);
  }

  if (question.type === "multiple_choice") {
    const picked = (Array.isArray(given) ? given : [given]).map(String);
    const correct = (question.options || [])
      .filter((option) => option.isCorrect)
      .map((option) => option.text);

    return (
      picked.length === correct.length &&
      correct.every((text) => picked.includes(text))
    );
  }

  const accepted = question.answer?.acceptedValues ?? [];

  if (question.type === "numeric") {
    const value = Number(given);
    const { min, max, tolerance = 0 } = question.answer?.numericRange ?? {};

    if (Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max)) {
      return value >= min - tolerance && value <= max + tolerance;
    }

    return accepted.some((item) => Number(item) === value);
  }

  const normalise = (text) => String(text).trim().toLowerCase();

  return accepted.some((item) => normalise(item) === normalise(given));
};

// The model stores score, maxScore, percentage and passed as flat fields;
// the client reads one score object.
const attemptView = (attempt) => {
  const plain = attempt.toObject ? attempt.toObject() : attempt;

  return {
    ...plain,
    score: {
      earned: plain.score ?? 0,
      total: plain.maxScore ?? 0,
      percentage: plain.percentage ?? 0,
      passed: plain.passed ?? null,
    },
  };
};

// Clients send { text, isCorrect }; the model also wants a short key per option.
const withOptionKeys = (options) =>
  (options || []).map((option, index) => ({
    ...option,
    key: option.key || String.fromCharCode(65 + index),
  }));

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

  const keyedOptions = withOptionKeys(options);

  const question = await Question.create({
    instituteId: req.user.instituteId,

    createdBy: req.user._id,

    text,
    title: title || null,
    type,
    difficulty: difficulty || "medium",
    status: status === "published" ? "active" : status || "draft",

    options: keyedOptions,
    answer: buildAnswer(type, keyedOptions, correctAnswer),
    explanation: explanation || null,

    marks: points || 1,

    subject: subject || null,
    topic: topic || null,
  });

  return sendCreated(res, {
    message: "Question created",
    data: questionView(question),
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
    data: questions.map(questionView),
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

  // Translate the client's words into the model's.
  if (updates.points !== undefined) {
    updates.marks = updates.points;
    delete updates.points;
  }

  if (updates.options !== undefined) {
    updates.options = withOptionKeys(updates.options);
  }

  if (
    updates.correctAnswer !== undefined ||
    updates.options !== undefined ||
    updates.type !== undefined
  ) {
    updates.answer = buildAnswer(
      updates.type ?? question.type,
      updates.options ?? question.options ?? [],
      updates.correctAnswer
    );
    delete updates.correctAnswer;
  }

  if (updates.status === "published") {
    updates.status = "active";
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
    data: questionView(updated),
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

  if (!test || !(await canSeeTestClass(req.user, test))) {
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

  const countedAttempts = await TestAttempt.find({
    testId: test._id,
    studentId: req.user._id,
    status: { $nin: ["abandoned", "expired"] },
  });

  // Resume only an attempt that is still open; finished attempts count
  // against the test's attempt limit instead of being handed back.
  const open = countedAttempts.find(
    (attempt) => attempt.status === "started"
  );

  if (open) {
    return sendSuccess(res, {
      message: "Attempt already in progress",
      data: open,
    });
  }

  if (
    countedAttempts.length >=
    (test.attemptPolicy?.maxAttempts ?? 1)
  ) {
    return sendError(
      res,
      400,
      "You have used all attempts for this test"
    );
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

    status: "started",
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
    .populate("testId", "title publicId grading.status grading.totalPoints")
    .populate("studentId", "name email userCode")
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: "Attempts fetched",
    data: attempts.map(attemptView),
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

  if (attempt.status !== "started") {
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
  let pendingReview = false;

  for (const question of test.questionIds || []) {
    total += question.marks || 1;

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
      Boolean(given) &&
      isObjective &&
      isAnswerCorrect(question, given.answer);

    if (isCorrect) {
      earned += question.marks || 1;
    }

    gradedAnswers.push({
      questionId: question._id,

      // Free text and option picks both arrive as one value.
      type: question.type === "numeric" ? "numeric" : "text",
      value: given?.answer ?? null,
      textAnswer:
        question.type === "numeric" || given?.answer == null
          ? undefined
          : String(given.answer),
      numericAnswer:
        question.type === "numeric" && given?.answer !== undefined
          ? Number(given.answer)
          : undefined,

      status: given ? "answered" : "unanswered",

      isCorrect: Boolean(isCorrect),

      score: isCorrect ? question.marks || 1 : 0,
      maxScore: question.marks || 1,
    });

    // Written answers need a person to mark them.
    if (!isObjective && given) {
      pendingReview = true;
    }
  }

  const hasPendingReview = pendingReview;

  attempt.answers = gradedAnswers;
  attempt.status = hasPendingReview
    ? "submitted"
    : "graded";

  attempt.score = earned;
  attempt.maxScore = total;
  attempt.percentage = total
    ? Math.round((earned / total) * 100)
    : 0;
  attempt.passed =
    test.grading?.passingScore !== undefined
      ? attempt.percentage >= test.grading.passingScore
      : null;

  attempt.submittedAt = new Date();

  await attempt.save();

  return sendSuccess(res, {
    message: "Attempt submitted",
    data: attemptView(attempt),
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

  // Students and parents hold test_attempt:update to submit their
  // own answers; they must never be able to award marks.
  if (["student", "parent"].includes(req.user.role)) {
    throw forbidden();
  }

  if (req.user.role === "teacher") {
    const gradedTest = await Test.findById(
      attempt.testId
    ).select("createdBy");

    if (
      String(gradedTest?.createdBy) !==
      String(req.user._id)
    ) {
      throw forbidden();
    }
  }

  if (score !== undefined) {
    attempt.score = score;
    attempt.percentage = attempt.maxScore
      ? Math.round((score / attempt.maxScore) * 100)
      : attempt.percentage ?? 0;
  }

  if (feedback !== undefined) {
    attempt.feedback = feedback;
  }

  attempt.status = "graded";

  attempt.reviewedBy = req.user._id;

  attempt.reviewedAt = new Date();

  await attempt.save();

  return sendSuccess(res, {
    message: "Attempt graded",
    data: attemptView(attempt),
  });
});
