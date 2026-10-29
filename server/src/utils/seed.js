// server/src/utils/seed.js
//
// Demo data for local testing: one organization with one user per role
// (plus their profiles, a class and a parent link), so every role can be
// walked through its pages.
//
//   npm run seed                  create anything that is missing
//   npm run seed -- --dry-run     build and validate every record, no database
//   npm run seed -- --reset       delete the demo data first, then recreate it
//
// Refuses to run when NODE_ENV=production. Sign in with
// <role>@demo.paisa.test and SEED_PASSWORD (default below).

import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../config/constants.js";
import { ORGANIZATION_ROLE_ARRAYS, STAFF_CODE_PREFIX } from "../config/userRoleConfig.js";

import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { Class } from "../models/Class.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Employee from "../models/Employee.js";
import HR from "../models/Hr.js";

const DEMO_DOMAIN = "demo.paisa.test";
const DEMO_SLUG = "demo-school";
const DEFAULT_PASSWORD = "Paisa@Demo1";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const RESET = args.has("--reset");

const password = process.env.SEED_PASSWORD || DEFAULT_PASSWORD;

const emailFor = (role) => `${role}@${DEMO_DOMAIN}`;

const nameFor = (role) =>
  `Demo ${role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;

// Roles that sign in, in the order they are listed in the summary.
const SEED_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.PRINCIPAL,
  ROLES.HR,
  ROLES.ACCOUNTANT,
  ROLES.COUNSELOR,
  ROLES.TEACHER,
  ROLES.SUPPORT,
  ROLES.EMPLOYEE,
  ROLES.PARENT,
  ROLES.STUDENT,
];

/**
 * Builds every document (not yet saved) so a dry run can validate them and
 * a real run can save them in dependency order.
 */
const buildDocuments = async () => {
  const passwordHash = await bcrypt.hash(password, 10);

  const orgId = new mongoose.Types.ObjectId();
  const users = {};

  for (const role of SEED_ROLES) {
    users[role] = new User({
      name: nameFor(role),
      email: emailFor(role),
      passwordHash,
      role,
      // Platform owner belongs to no organization.
      instituteId: role === ROLES.SUPER_ADMIN ? undefined : orgId,
      status: "active",
      emailVerified: true,
      mustChangePassword: false,
    });
  }

  const organization = new Organization({
    _id: orgId,
    name: "Demo School",
    slug: DEMO_SLUG,
    type: "school",
    owner: users[ROLES.ADMIN]._id,
  });

  // Same arrays the user-creation endpoint maintains.
  for (const [role, field] of Object.entries(ORGANIZATION_ROLE_ARRAYS)) {
    organization[field] = [users[role]._id];
  }

  const profiles = [];

  for (const [role, prefix] of Object.entries(STAFF_CODE_PREFIX)) {
    const code = `${prefix}-00001`;

    profiles.push(
      new Employee({
        userId: users[role]._id,
        instituteId: orgId,
        employeeCode: code,
        employeeId: code,
        firstName: "Demo",
        lastName: role,
        displayName: nameFor(role),
        workEmail: emailFor(role),
        employmentStatus: "active",
      })
    );
  }

  profiles.push(
    new Teacher({
      userId: users[ROLES.TEACHER]._id,
      instituteId: orgId,
    }),
    new HR({
      userId: users[ROLES.HR]._id,
      instituteId: orgId,
    }),
    new Student({
      userId: users[ROLES.STUDENT]._id,
      instituteId: orgId,
      enrollmentNumber: "DEMO-0001",
      course: "Grade 10",
      // Lets the demo parent see this student's records.
      guardianUserIds: [users[ROLES.PARENT]._id],
    })
  );

  const classroom = new Class({
    instituteId: orgId,
    name: "Demo Class 10A",
    subject: "Mathematics",
    teacherId: users[ROLES.TEACHER]._id,
    studentIds: [users[ROLES.STUDENT]._id],
  });

  return { organization, users, profiles, classroom };
};

const validateAll = async ({ organization, users, profiles, classroom }) => {
  const docs = [organization, ...Object.values(users), ...profiles, classroom];

  for (const doc of docs) {
    await doc.validate();
  }

  return docs.length;
};

const removeDemoData = async () => {
  const org = await Organization.findOne({ slug: DEMO_SLUG }).select("_id");

  if (org) {
    await Promise.all(
      [Class, Student, Teacher, Employee, HR].map((Model) =>
        Model.deleteMany({ instituteId: org._id })
      )
    );
    await Organization.deleteOne({ _id: org._id });
  }

  await User.deleteMany({ email: { $regex: `@${DEMO_DOMAIN.replace(/\./g, "\\.")}$` } });
};

const saveAll = async ({ organization, users, profiles, classroom }) => {
  // Organization first (it owns the admin), then people, then their data.
  await organization.save();

  for (const role of SEED_ROLES) {
    await users[role].save();
  }

  for (const profile of profiles) {
    await profile.save();
  }

  await classroom.save();
};

const printSummary = () => {
  console.log("\nDemo accounts (password: %s)", password);

  for (const role of SEED_ROLES) {
    console.log("  %s  %s", role.padEnd(12), emailFor(role));
  }
};

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production");
  }

  if (DRY_RUN) {
    const count = await validateAll(await buildDocuments());
    console.log("Dry run OK: %d documents validated, nothing written.", count);
    return;
  }

  await connectDB();

  try {
    if (RESET) {
      await removeDemoData();
      console.log("Removed existing demo data.");
    } else if (await Organization.exists({ slug: DEMO_SLUG })) {
      console.log("Demo data already exists. Run with --reset to recreate it.");
      printSummary();
      return;
    }

    const documents = await buildDocuments();
    await validateAll(documents);
    await saveAll(documents);

    console.log("Seeded demo organization with %d users.", SEED_ROLES.length);
    printSummary();
  } finally {
    await disconnectDB();
  }
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
