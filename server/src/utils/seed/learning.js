// server/src/utils/seed/learning.js
//
// Learning demo data for the demo school (see demoData.js for ctx):
// assignments + submissions, a small question bank, one published test per
// class with finished attempts, study materials, ~14 school days of student
// class attendance, issued certificates and class enrolments.
//
// Every record goes through seeder.ensure keyed on a stable natural key, so
// re-running never duplicates. Stored shapes mirror what the controllers
// write (testController / submissionController / hrOpsController ...).

import { ROLES } from "../../config/constants.js";

import { Assignment } from "../../models/Assignment.js";
import Submission from "../../models/Submission.js";
import { Question } from "../../models/Question.js";
import { Test } from "../../models/Test.js";
import { TestAttempt } from "../../models/TestAttempt.js";
import StudyMaterial from "../../models/StudyMaterial.js";
import { Attendance } from "../../models/Attendance.js";
import { Certificate } from "../../models/Certificate.js";
import { Enrollment } from "../../models/Enrollment.js";

import { DAY_MS, dayOffset } from "./helpers.js";

const at = (offset, hours = 0, minutes = 0) =>
  new Date(dayOffset(offset).getTime() + (hours * 60 + minutes) * 60000);

const percentOf = (score, max) => (max ? Math.round((score / max) * 100) : 0);

/* -------------------------------------------------------------------------- */
/* Class context                                                              */
/* -------------------------------------------------------------------------- */

// Per class (same order as ctx.classes): short key used in natural keys.
const CLASS_KEYS = ["10A-MATH", "10A-SCI", "9B-ENG"];

const classContexts = (ctx) =>
  ctx.classes.map((cls, index) => {
    const ids = new Set((cls.studentIds ?? []).map(String));

    return {
      cls,
      index,
      key: CLASS_KEYS[index],
      teacherId: cls.teacherId ?? ctx.teachers[index === 1 ? 1 : 0]._id,
      // Only the known demo students, in ctx order (demo student first).
      students: ctx.students.filter((s) => ids.has(String(s.user._id))),
    };
  });

/* -------------------------------------------------------------------------- */
/* Assignments + submissions                                                  */
/* -------------------------------------------------------------------------- */

const ASSIGNMENTS = [
  [
    {
      title: "Quadratic Equations Worksheet",
      description: "Solve the 15 problems on factorisation and the quadratic formula.",
      type: "homework",
      due: -5,
      maxScore: 20,
    },
    {
      title: "Coordinate Geometry Practice Set",
      description: "Distance formula, section formula and area of a triangle.",
      type: "practice",
      due: 6,
      maxScore: 20,
    },
  ],
  [
    {
      title: "Chemical Reactions Lab Report",
      description: "Write up the displacement reaction experiment with observations.",
      type: "lab",
      due: -4,
      maxScore: 25,
    },
    {
      title: "Light: Reflection and Refraction Notes",
      description: "Summarise the chapter and draw the ray diagrams for concave mirrors.",
      type: "homework",
      due: 8,
      maxScore: 10,
    },
  ],
  [
    {
      title: "Essay: A Memorable Journey",
      description: "Write a 400-word narrative essay about a journey you remember.",
      type: "assignment",
      due: -6,
      maxScore: 50,
    },
    {
      title: "Poetry Analysis: The Road Not Taken",
      description: "Discuss the theme, imagery and rhyme scheme of the poem.",
      type: "assignment",
      due: 5,
      maxScore: 30,
    },
  ],
];

const FEEDBACK = [
  "Well structured and accurate. Keep it up!",
  "Good effort. Check the steps in questions 4 and 9.",
  "Nice work. Show a little more working next time.",
];

// Fraction of maxScore each graded submitter earns (by position in class).
const GRADE_FRACTIONS = [0.9, 0.7, 0.8];

const seedAssignments = async (seeder, ctx, classes) => {
  for (const c of classes) {
    for (const spec of ASSIGNMENTS[c.index]) {
      const past = spec.due < 0;
      const dueDate = at(spec.due, 23, 59);

      // Past-due: everyone but the last student submits, first two graded.
      const plan = past
        ? c.students.slice(0, -1).map((s, i) => ({
            student: s,
            graded: i < 2,
            score: Math.round(spec.maxScore * GRADE_FRACTIONS[i % GRADE_FRACTIONS.length]),
            // The third submitter hands in a day late.
            submittedAt: at(spec.due + (i === 2 ? 1 : -1), 18 + i, 10),
          }))
        : [];

      const graded = plan.filter((p) => p.graded);

      const assignment = await seeder.ensure(
        Assignment,
        { instituteId: ctx.org._id, classId: c.cls._id, title: spec.title },
        {
          description: spec.description,
          instructions: "Submit your work as text or a link before the due date.",
          assignmentType: spec.type,
          createdBy: c.teacherId,
          availableFrom: at(spec.due - 7, 8),
          dueDate,
          maxScore: spec.maxScore,
          passingScore: Math.round(spec.maxScore * 0.4),
          submissionMode: "file_and_text",
          status: "published",
          publishedAt: at(spec.due - 7, 8),
          stats: {
            totalStudents: c.students.length,
            submitted: plan.length,
            graded: graded.length,
            pending: plan.length - graded.length,
            averageScore: graded.length
              ? graded.reduce((sum, p) => sum + p.score, 0) / graded.length
              : null,
            averagePercentage: graded.length
              ? graded.reduce((sum, p) => sum + percentOf(p.score, spec.maxScore), 0) / graded.length
              : null,
            lastComputedAt: past ? at(spec.due + 2, 16) : null,
          },
        }
      );

      for (const [i, p] of plan.entries()) {
        await seeder.ensure(
          Submission,
          { assignmentId: assignment._id, studentId: p.student.user._id },
          {
            instituteId: ctx.org._id,
            content: `${spec.title} - submitted by ${p.student.user.name}.`,
            submittedAt: p.submittedAt,
            isLate: p.submittedAt > dueDate,
            maxScore: spec.maxScore,
            status: p.graded ? "graded" : "submitted",
            ...(p.graded
              ? {
                  score: p.score,
                  feedback: FEEDBACK[i % FEEDBACK.length],
                  gradedBy: c.teacherId,
                  gradedAt: at(spec.due + 2, 16),
                }
              : {}),
          }
        );
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Questions, tests, attempts                                                 */
/* -------------------------------------------------------------------------- */

const tf = (correct) => [
  { key: "A", text: "True", isCorrect: correct === true, order: 0 },
  { key: "B", text: "False", isCorrect: correct === false, order: 1 },
];

const choices = (texts, correctIndex) =>
  texts.map((text, i) => ({
    key: String.fromCharCode(65 + i),
    text,
    isCorrect: i === correctIndex,
    order: i,
  }));

// Per class: questions owned by the class teacher. `right` is the answer a
// correct student gives (option text for choices, value otherwise).
const QUESTIONS = [
  [
    {
      code: "Q1",
      type: "single_choice",
      text: "What are the roots of x^2 - 5x + 6 = 0?",
      options: choices(["1 and 6", "2 and 3", "-2 and -3", "3 and 5"], 1),
      right: "2 and 3",
      wrong: "1 and 6",
      marks: 2,
      topic: "Quadratic Equations",
    },
    {
      code: "Q2",
      type: "true_false",
      text: "The discriminant of a quadratic with two equal roots is zero.",
      options: tf(true),
      answer: "True",
      right: "True",
      wrong: "False",
      marks: 1,
      topic: "Quadratic Equations",
    },
    {
      code: "Q3",
      type: "short_answer",
      text: "State the distance formula between points (x1, y1) and (x2, y2).",
      answer: "sqrt((x2-x1)^2 + (y2-y1)^2)",
      right: "sqrt((x2-x1)^2 + (y2-y1)^2)",
      wrong: "(x2-x1) + (y2-y1)",
      marks: 2,
      topic: "Coordinate Geometry",
    },
  ],
  [
    {
      code: "Q1",
      type: "single_choice",
      text: "Which gas is released when zinc reacts with dilute hydrochloric acid?",
      options: choices(["Oxygen", "Chlorine", "Hydrogen", "Carbon dioxide"], 2),
      right: "Hydrogen",
      wrong: "Oxygen",
      marks: 2,
      topic: "Chemical Reactions",
    },
    {
      code: "Q2",
      type: "true_false",
      text: "A concave mirror can form a virtual image.",
      options: tf(true),
      answer: "True",
      right: "True",
      wrong: "False",
      marks: 1,
      topic: "Light",
    },
  ],
  [
    {
      code: "Q1",
      type: "single_choice",
      text: "Who wrote the poem 'The Road Not Taken'?",
      options: choices(["Robert Frost", "William Wordsworth", "John Keats", "Walt Whitman"], 0),
      right: "Robert Frost",
      wrong: "John Keats",
      marks: 2,
      topic: "Poetry",
    },
    {
      code: "Q2",
      type: "true_false",
      text: "A simile compares two things using 'like' or 'as'.",
      options: tf(true),
      answer: "True",
      right: "True",
      wrong: "False",
      marks: 1,
      topic: "Figures of Speech",
    },
  ],
];

const SUBJECTS = ["Mathematics", "Science", "English"];

const TESTS = [
  { title: "Maths Unit Test 1: Algebra and Geometry", type: "unit_test", taken: -3 },
  { title: "Science Quiz: Reactions and Light", type: "quiz", taken: -2 },
  { title: "English Quiz: Poetry and Grammar", type: "quiz", taken: -4 },
];

// Per attempt slot: which questions the student gets right (by index).
const ATTEMPT_PATTERNS = [
  [true, true, true],
  [true, false, true],
  [false, true, false],
];

const answerFor = (question, given, correct, isObjective) => ({
  questionId: question._id,
  type: "text",
  value: given,
  textAnswer: String(given),
  status: "answered",
  isCorrect: isObjective ? correct : null,
  score: correct ? question.marks : 0,
  maxScore: question.marks,
});

const seedTests = async (seeder, ctx, classes) => {
  const prefix = ctx.spec.codePrefix;

  for (const c of classes) {
    const questions = [];

    for (const spec of QUESTIONS[c.index]) {
      const question = await seeder.ensure(
        Question,
        { instituteId: ctx.org._id, questionCode: `${prefix}-${c.key}-${spec.code}` },
        {
          createdBy: c.teacherId,
          text: spec.text,
          type: spec.type,
          difficulty: "medium",
          status: "active",
          visibility: "institute",
          subject: SUBJECTS[c.index],
          topic: spec.topic,
          classId: c.cls._id,
          marks: spec.marks,
          options: spec.options ?? [],
          // Same answer shape as testController's buildAnswer.
          answer:
            spec.type === "single_choice"
              ? {
                  type: "option",
                  acceptedOptions: spec.options.filter((o) => o.isCorrect).map((o) => o.key),
                }
              : {
                  type: spec.type === "true_false" ? "boolean" : "text",
                  acceptedValues: [spec.answer],
                  caseSensitive: false,
                  trimWhitespace: true,
                },
        }
      );

      questions.push({ doc: question, spec });
    }

    const testSpec = TESTS[c.index];
    const totalMarks = questions.reduce((sum, q) => sum + q.spec.marks, 0);

    const test = await seeder.ensure(
      Test,
      { instituteId: ctx.org._id, code: `${prefix}-T-${c.key}` },
      {
        createdBy: c.teacherId,
        title: testSpec.title,
        description: `Short ${SUBJECTS[c.index].toLowerCase()} assessment for ${c.cls.name}.`,
        instructions: "Answer every question. You have one attempt.",
        type: testSpec.type,
        mode: "online",
        status: "published",
        publishedAt: at(testSpec.taken - 2, 9),
        classId: c.cls._id,
        subject: SUBJECTS[c.index],
        academicYear: "2026-27",
        questionMode: "mixed",
        questionIds: questions.map((q) => q.doc._id),
        questionCount: questions.length,
        totalMarks,
        scheduling: {
          availableFrom: at(testSpec.taken - 2, 9),
          durationMinutes: 20,
        },
        // Same convention as the API: passingScore is a percentage of 100.
        grading: { mode: "automatic", maxScore: 100, passingScore: 40, passingPercentage: 40 },
        access: { classIds: [c.cls._id] },
        results: { visibility: "immediate" },
      }
    );

    // Up to 3 students attempt (2 for the smaller pattern set if needed).
    const takers = c.students.slice(0, 3);

    for (const [slot, student] of takers.entries()) {
      const pattern = ATTEMPT_PATTERNS[(slot + c.index) % ATTEMPT_PATTERNS.length];
      const startedAt = at(testSpec.taken, 10 + slot, 0);
      const submittedAt = new Date(startedAt.getTime() + (12 + slot * 3) * 60000);

      let earned = 0;
      let pendingReview = false;
      const answers = [];

      for (const [qi, q] of questions.entries()) {
        const correct = pattern[qi % pattern.length];
        const isObjective = q.spec.type !== "short_answer";
        const given = correct ? q.spec.right : q.spec.wrong;

        // Written answers: first taker's attempt was reviewed by the teacher,
        // the others still wait for review (status "submitted").
        const counts = isObjective ? correct : slot === 0 && correct;

        if (!isObjective && slot !== 0) pendingReview = true;
        if (counts) earned += q.spec.marks;

        answers.push(answerFor(q.doc, given, counts, isObjective));
      }

      const percentage = percentOf(earned, totalMarks);
      const passed = percentage >= 40;
      const graded = !pendingReview;
      const hasWritten = questions.some((q) => q.spec.type === "short_answer");

      await seeder.ensure(
        TestAttempt,
        {
          instituteId: ctx.org._id,
          testId: test._id,
          studentId: student.user._id,
          attemptNumber: 1,
        },
        {
          classId: c.cls._id,
          status: graded ? "graded" : "submitted",
          submissionSource: "student",
          startedAt,
          submittedAt,
          completedAt: submittedAt,
          lastActivityAt: submittedAt,
          durationSeconds: Math.round((submittedAt - startedAt) / 1000),
          timeLimitSeconds: 20 * 60,
          questionIds: questions.map((q) => q.doc._id),
          questionsVisited: questions.length,
          answers,
          score: earned,
          maxScore: totalMarks,
          percentage,
          passed,
          reviewRequired: !graded,
          ...(graded && hasWritten
            ? {
                reviewedBy: c.teacherId,
                reviewedAt: new Date(submittedAt.getTime() + DAY_MS),
                feedback: "Good attempt. Written answer checked.",
              }
            : {}),
          grading: {
            mode: hasWritten ? "hybrid" : "automatic",
            score: earned,
            maxScore: totalMarks,
            percentage,
            passed,
            gradedBy: graded && hasWritten ? c.teacherId : null,
            gradedAt: graded ? submittedAt : null,
          },
          configurationSnapshot: {
            maxAttempts: 1,
            passingPercentage: 40,
            timeLimitSeconds: 20 * 60,
            capturedAt: startedAt,
          },
        }
      );
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Study materials                                                            */
/* -------------------------------------------------------------------------- */

// classIndex null = institute-wide.
const MATERIALS = [
  {
    title: "School Timetable and Exam Calendar 2026-27",
    description: "Term dates, unit test weeks and holidays for the academic year.",
    subject: "General",
    classIndex: null,
    url: "https://www.cbse.gov.in/cbsenew/academic.html",
  },
  {
    title: "How to Study Effectively: Study Skills Guide",
    description: "Spaced repetition, active recall and planning your revision.",
    subject: "General",
    classIndex: null,
    url: "https://www.khanacademy.org/college-careers-more/learnstorm-growth-mindset-activities-us",
  },
  {
    title: "NCERT Class 10 Mathematics Textbook",
    description: "Official NCERT textbook chapters for Class 10 Mathematics.",
    subject: "Mathematics",
    classIndex: 0,
    url: "https://ncert.nic.in/textbook.php?jemh1=0-15",
  },
  {
    title: "Quadratic Equations Video Lesson",
    description: "Step-by-step walkthrough of factorisation and the quadratic formula.",
    subject: "Mathematics",
    classIndex: 0,
    url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations",
  },
  {
    title: "Chemical Reactions and Equations: Chapter Notes",
    description: "Types of reactions, balancing equations and worked examples.",
    subject: "Science",
    classIndex: 1,
    url: "https://ncert.nic.in/textbook.php?jesc1=0-13",
  },
  {
    title: "Poetry Reading List: Term 1",
    description: "Poems we will read in class this term, with short introductions.",
    subject: "English",
    classIndex: 2,
    url: "https://www.poetryfoundation.org/poems/44272/the-road-not-taken",
  },
];

const seedStudyMaterials = async (seeder, ctx, classes) => {
  for (const [i, spec] of MATERIALS.entries()) {
    const c = spec.classIndex == null ? null : classes[spec.classIndex];

    await seeder.ensure(
      StudyMaterial,
      { instituteId: ctx.org._id, title: spec.title },
      {
        classId: c ? c.cls._id : null,
        visibility: c ? "class_only" : "institute",
        uploadedBy: c ? c.teacherId : ctx.users[ROLES.PRINCIPAL]?._id ?? ctx.teachers[0]._id,
        description: spec.description,
        subject: spec.subject,
        type: "link",
        url: spec.url,
        storageProvider: "external",
        tags: [spec.subject.toLowerCase()],
        availableFrom: dayOffset(-20 + i),
        analytics: { views: 12 + i * 7, uniqueViewers: 4 + i, lastViewedAt: at(-1, 15) },
      }
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Student attendance                                                         */
/* -------------------------------------------------------------------------- */

const SCHOOL_DAYS = 14;

const schoolDays = () => {
  const days = [];

  for (let offset = -1; days.length < SCHOOL_DAYS; offset -= 1) {
    if (dayOffset(offset).getUTCDay() !== 0) days.push(offset); // skip Sundays
  }

  return days;
};

const seedAttendance = async (seeder, ctx, classes) => {
  const days = schoolDays();

  for (const c of classes) {
    for (const [dayIndex, offset] of days.entries()) {
      for (const [si, student] of c.students.entries()) {
        const studentIndex = ctx.students.indexOf(student);
        const roll = (studentIndex * 7 + dayIndex * 3 + c.index * 5) % 20;
        const status = roll === 0 ? "absent" : roll === 1 ? "late" : "present";

        await seeder.ensure(
          Attendance,
          {
            instituteId: ctx.org._id,
            userId: student.user._id,
            date: dayOffset(offset),
            classId: c.cls._id,
          },
          {
            status,
            lateBy: status === "late" ? 10 + si * 5 : null,
            notes: status === "absent" ? "Absent - parent informed" : status === "late" ? "Arrived late" : null,
            markedBy: c.teacherId,
            markedVia: "manual",
            source: "web",
          }
        );
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/* Certificates                                                               */
/* -------------------------------------------------------------------------- */

const CERTIFICATES = [
  {
    no: "L001",
    student: 0,
    classIndex: 0,
    title: "Mathematics Olympiad - School Round Merit",
    type: "achievement",
    description: "Awarded for securing a merit position in the school Mathematics Olympiad.",
    issued: -10,
  },
  {
    no: "L002",
    student: 1,
    classIndex: 1,
    title: "Science Fair 2026 - Participation",
    type: "participation",
    description: "For presenting a working model at the annual Science Fair.",
    issued: -7,
  },
  {
    no: "L003",
    student: 2,
    classIndex: 2,
    title: "Spoken English Foundation Course - Completion",
    type: "course_completion",
    description: "Successfully completed the 8-week Spoken English Foundation course.",
    issued: -3,
  },
];

const seedCertificates = async (seeder, ctx, classes) => {
  const prefix = ctx.spec.codePrefix;
  const issuer = ctx.users[ROLES.PRINCIPAL] ?? ctx.users[ROLES.ADMIN];
  const frontend = String(process.env.FRONTEND_URL || "").replace(/\/+$/, "");

  for (const spec of CERTIFICATES) {
    const student = ctx.students[spec.student];
    const c = classes[spec.classIndex];
    const certificateNumber = `CRT-${prefix}-${spec.no}`;
    const verificationCode = `${prefix}-CERT-${spec.no}`;
    const issueDate = dayOffset(spec.issued);

    await seeder.ensure(
      Certificate,
      { instituteId: ctx.org._id, certificateNumber },
      {
        certificateCode: verificationCode,
        externalId: certificateNumber,
        title: spec.title,
        description: spec.description,
        type: spec.type,
        status: "issued",
        userId: student.user._id,
        studentId: student.profile?._id ?? null,
        classId: c.cls._id,
        issueDate,
        completionDate: issueDate,
        recipientSnapshot: {
          name: student.user.name,
          email: student.user.email,
          className: c.cls.name,
        },
        issuer: {
          userId: issuer._id,
          name: issuer.name ?? null,
          designation: "Principal",
          organizationName: ctx.org.name ?? null,
        },
        subjectName: c.cls.subject ?? null,
        verification: {
          status: "unverified",
          verificationCode,
          verificationUrl: `${frontend}/verify/${verificationCode}`,
        },
        history: [
          {
            action: "issued",
            fromStatus: null,
            toStatus: "issued",
            performedBy: issuer._id,
            performedAt: issueDate,
          },
        ],
        source: "manual",
        createdBy: issuer._id,
      }
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Enrollments                                                                */
/* -------------------------------------------------------------------------- */

const seedEnrollments = async (seeder, ctx, classes) => {
  const prefix = ctx.spec.codePrefix;
  const admin = ctx.users[ROLES.ADMIN];

  for (const c of classes) {
    for (const student of c.students) {
      const number = String(ctx.students.indexOf(student) + 1).padStart(2, "0");
      const enrollmentNumber = `${prefix}-ENR-${c.key}-${number}`;

      await seeder.ensure(
        Enrollment,
        { instituteId: ctx.org._id, enrollmentNumber },
        {
          enrollmentCode: enrollmentNumber,
          status: "active",
          type: "class",
          studentId: student.user._id,
          classId: c.cls._id,
          academicYear: "2026-27",
          appliedAt: dayOffset(-60),
          approvedAt: dayOffset(-58),
          enrolledAt: dayOffset(-58),
          startDate: dayOffset(-58),
          academicSnapshot: {
            academicYear: "2026-27",
            className: c.cls.name,
            courseName: c.cls.subject ?? null,
          },
          history: [
            { action: "created", toStatus: "active", changedBy: admin._id, changedAt: dayOffset(-58) },
          ],
          createdBy: admin._id,
        }
      );
    }
  }
};

/* -------------------------------------------------------------------------- */

export const seedLearning = async (seeder, ctx) => {
  const classes = classContexts(ctx);

  await seedAssignments(seeder, ctx, classes);
  await seedTests(seeder, ctx, classes);
  await seedStudyMaterials(seeder, ctx, classes);
  await seedAttendance(seeder, ctx, classes);
  await seedCertificates(seeder, ctx, classes);
  await seedEnrollments(seeder, ctx, classes);
};
