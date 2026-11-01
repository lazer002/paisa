// server/src/utils/seed/demoData.js
//
// Rich demo data for the demo school so every role's lists show real
// records. Everything goes through seeder.ensure (idempotent, never deletes).
//
// Shared context passed to every area module (ctx):
//   org          Organization doc of the demo school
//   users        role -> User (the <role>@demo.paisa.test accounts)
//   students     [{ user, profile }] every demo student (demo student first)
//   parents      [User] every demo parent (demo parent first)
//   teachers     [User] demo teacher first, then extra teachers
//   classes      [Class] (Demo Class 10A first)
//   departments  name -> Department
//   spec, passwordHash

import { ROLES } from "../../config/constants.js";

import { User } from "../../models/User.js";
import { Class } from "../../models/Class.js";
import Student from "../../models/student.js";
import Teacher from "../../models/teacher.js";
import { Department } from "../../models/Department.js";

import { findRaw } from "./helpers.js";
import { seedLearning } from "./learning.js";
import { seedHrFinance } from "./hrFinance.js";
import { seedCrmComms } from "./crmComms.js";

const EXTRA_STUDENTS = [
  { first: "Aarav", last: "Sharma", parent: "sunita.sharma" },
  { first: "Diya", last: "Patel", parent: "rajesh.patel" },
  { first: "Kabir", last: "Singh", parent: "sunita.sharma" },
  { first: "Meera", last: "Iyer", parent: "parent" },
  { first: "Rohan", last: "Gupta", parent: "rajesh.patel" },
];

const EXTRA_PARENTS = [
  { first: "Sunita", last: "Sharma" },
  { first: "Rajesh", last: "Patel" },
];

const EXTRA_TEACHERS = [{ first: "Neha", last: "Verma" }];

const ensurePerson = (seeder, ctx, { first, last }, role, code) =>
  seeder.ensure(
    User,
    { email: `${first}.${last}@${ctx.spec.domain}`.toLowerCase() },
    {
      name: `${first} ${last}`,
      passwordHash: ctx.passwordHash,
      role,
      userCode: `${ctx.spec.codePrefix}-${code}`,
      instituteId: ctx.org._id,
      status: "active",
      emailVerified: true,
      mustChangePassword: false,
    }
  );

const seedPeople = async (seeder, ctx) => {
  const { org, users } = ctx;

  // Parents first so students can link to them.
  const parentByKey = { parent: users[ROLES.PARENT] };

  for (const [index, person] of EXTRA_PARENTS.entries()) {
    const user = await ensurePerson(seeder, ctx, person, ROLES.PARENT, `PAR-${String(index + 2).padStart(2, "0")}`);
    parentByKey[`${person.first}.${person.last}`.toLowerCase()] = user;
  }

  ctx.parents = Object.values(parentByKey);

  const demoStudentProfile = seeder.dryRun
    ? null
    : await findRaw(Student, { instituteId: org._id, userId: users[ROLES.STUDENT]._id });

  ctx.students = [{ user: users[ROLES.STUDENT], profile: demoStudentProfile }];

  for (const [index, person] of EXTRA_STUDENTS.entries()) {
    const number = String(index + 2).padStart(2, "0");
    const user = await ensurePerson(seeder, ctx, person, ROLES.STUDENT, `STU-${number}`);
    const parent = parentByKey[person.parent];

    const profile = await seeder.ensure(
      Student,
      { instituteId: org._id, userId: user._id },
      {
        enrollmentNumber: `DEMO-S-00${number}`,
        course: index < 3 ? "Grade 10" : "Grade 9",
        guardianUserIds: parent ? [parent._id] : [],
      }
    );

    ctx.students.push({ user, profile });
  }

  ctx.teachers = [users[ROLES.TEACHER]];

  for (const [index, person] of EXTRA_TEACHERS.entries()) {
    const user = await ensurePerson(seeder, ctx, person, ROLES.TEACHER, `TCH-${String(index + 2).padStart(2, "0")}`);
    await seeder.ensure(Teacher, { instituteId: org._id, userId: user._id });
    ctx.teachers.push(user);
  }
};

const CLASS_SPECS = [
  { code: "DEMO-10A", name: "Demo Class 10A", subject: "Mathematics", teacher: 0, students: [0, 1, 2, 3] },
  { code: "DEMO-10A-SCI", name: "Class 10A Science", subject: "Science", teacher: 1, students: [0, 1, 4, 5] },
  { code: "DEMO-9B-ENG", name: "Class 9B English", subject: "English", teacher: 0, students: [2, 3, 4, 5] },
];

const seedClasses = async (seeder, ctx) => {
  ctx.classes = [];

  for (const spec of CLASS_SPECS) {
    const studentIds = spec.students.map((i) => ctx.students[i].user._id);

    // The original demo class was saved without a code: match by name first.
    const byName = seeder.dryRun
      ? null
      : await findRaw(Class, { instituteId: ctx.org._id, name: spec.name, isDeleted: { $ne: true } });

    if (byName) seeder.markExisting(Class);

    const cls = byName ?? await seeder.ensure(
      Class,
      { instituteId: ctx.org._id, code: spec.code },
      {
        name: spec.name,
        subject: spec.subject,
        teacherId: ctx.teachers[spec.teacher]._id,
        studentIds,
      }
    );

    // The class may predate the extra students: enrol them (idempotent).
    if (!seeder.dryRun) {
      await Class.updateOne({ _id: cls._id }, { $addToSet: { studentIds: { $each: studentIds } } });
      cls.studentIds = [...new Set([...(cls.studentIds ?? []), ...studentIds].map(String))];
    }

    ctx.classes.push(cls);
  }
};

const DEPARTMENT_SPECS = [
  { name: "Academics", code: "ACAD", head: ROLES.PRINCIPAL, description: "Teaching staff and curriculum" },
  { name: "Administration", code: "ADMIN", head: ROLES.ADMIN, description: "School office and operations" },
  { name: "Finance", code: "FIN", head: ROLES.ACCOUNTANT, description: "Fees, invoices and payroll payments" },
  { name: "Human Resources", code: "HR", head: ROLES.HR, description: "Hiring, leave and payroll" },
  { name: "Admissions", code: "ADM", head: ROLES.COUNSELOR, description: "Enquiries and enrolments" },
  { name: "Student Support", code: "SUPP", head: ROLES.SUPPORT, description: "Helpdesk for parents and students" },
];

const seedDepartments = async (seeder, ctx) => {
  ctx.departments = {};

  for (const spec of DEPARTMENT_SPECS) {
    ctx.departments[spec.name] = await seeder.ensure(
      Department,
      { instituteId: ctx.org._id, name: spec.name },
      {
        code: spec.code,
        description: spec.description,
        head: ctx.users[spec.head]?._id ?? null,
        createdBy: ctx.users[ROLES.ADMIN]._id,
      }
    );
  }
};

// Each area runs even if an earlier one failed, so one broken area does not
// hide the others; any failure still makes the seed exit non-zero.
const runArea = async (name, fn) => {
  try {
    await fn();
  } catch (error) {
    console.error("Seed area '%s' failed: %s", name, error.message);
    process.exitCode = 1;
  }
};

export const seedDemoData = async (seeder, base) => {
  const ctx = { ...base };

  await seedPeople(seeder, ctx);
  await seedClasses(seeder, ctx);
  await seedDepartments(seeder, ctx);

  await runArea("learning", () => seedLearning(seeder, ctx));
  await runArea("hr-finance", () => seedHrFinance(seeder, ctx));
  await runArea("crm-comms", () => seedCrmComms(seeder, ctx));
};
