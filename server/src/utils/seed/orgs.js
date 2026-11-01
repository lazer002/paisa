// server/src/utils/seed/orgs.js
//
// Demo organizations and their sign-in users (one per role) plus the
// business profile each role needs (Employee / Teacher / HR / Student).

import mongoose from "mongoose";

import { ROLES } from "../../config/constants.js";
import { ORGANIZATION_ROLE_ARRAYS, STAFF_CODE_PREFIX } from "../../config/userRoleConfig.js";

import { User } from "../../models/User.js";
import Organization from "../../models/organization.js";
import Student from "../../models/student.js";
import Teacher from "../../models/teacher.js";
import Employee from "../../models/Employee.js";
import HR from "../../models/Hr.js";

import { findRaw } from "./helpers.js";

export const titleCase = (value) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// The original demo school: one user per role (super_admin has no org).
export const DEMO_ORG = {
  slug: "demo-school",
  name: "Demo School",
  type: "school",
  domain: "demo.paisa.test",
  codePrefix: "DEMO",
  namePrefix: "Demo",
  roles: [
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
  ],
};

// A second tenant (company) used by the tenant-isolation e2e test. A company
// may only hold these roles (see the role check in models/User.js).
export const SECOND_ORG = {
  slug: "demo2-company",
  name: "Demo Company Two",
  type: "company",
  domain: "demo2.paisa.test",
  codePrefix: "DEMO2",
  namePrefix: "Demo2",
  roles: [ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT, ROLES.SUPPORT, ROLES.EMPLOYEE],
};

export const emailFor = (spec, role) => `${role}@${spec.domain}`;

/**
 * Creates the organization (if missing), every role user (if missing) and
 * their profiles. Returns { org, users } where users maps role -> User.
 */
export const ensureOrganization = async (seeder, spec, passwordHash) => {
  const { ensure, dryRun } = seeder;
  const adminId = new mongoose.Types.ObjectId();

  const existingAdmin = dryRun
    ? null
    : await findRaw(User, { email: emailFor(spec, ROLES.ADMIN) });

  // By slug, or through the demo admin (the slug follows renames).
  let org = dryRun
    ? null
    : (await findRaw(Organization, { slug: spec.slug })) ??
      (existingAdmin?.instituteId
        ? await findRaw(Organization, { _id: existingAdmin.instituteId })
        : null);

  // The demo tenants must be usable: undo a soft delete (e.g. from an org
  // delete/restore test) instead of failing on the unique slug.
  if (org?.isDeleted) {
    await Organization.collection.updateOne(
      { _id: org._id },
      { $set: { isDeleted: false, deletedAt: null, deletionReason: null, status: "active" } }
    );
    console.log("Restored soft-deleted demo organization %s.", spec.slug);
  }

  if (!org) {
    org = await ensure(
      Organization,
      { slug: spec.slug },
      {
        name: spec.name,
        type: spec.type,
        owner: existingAdmin?._id ?? adminId,
        contact: { email: `office@${spec.domain}`, city: "Bengaluru", state: "Karnataka" },
      }
    );
  } else {
    seeder.stats.has("Organization") || seeder.stats.set("Organization", { created: 0, existing: 0 });
    seeder.stats.get("Organization").existing += 1;
  }

  const users = {};

  for (const role of spec.roles) {
    users[role] = await ensure(
      User,
      { email: emailFor(spec, role) },
      {
        ...(role === ROLES.ADMIN ? { _id: org.owner } : {}),
        name: `${spec.namePrefix} ${titleCase(role)}`,
        passwordHash,
        role,
        // Explicit code: the shared per-role counters may be behind the
        // users already in the database, which made generated codes collide.
        userCode: `${spec.codePrefix}-${role.toUpperCase().replace(/_/g, "")}`,
        instituteId: role === ROLES.SUPER_ADMIN ? undefined : org._id,
        status: "active",
        emailVerified: true,
        mustChangePassword: false,
      }
    );
  }

  await ensureProfiles(seeder, spec, org, users);

  return { org, users };
};

export const ensureProfiles = async (seeder, spec, org, users) => {
  const { ensure } = seeder;

  for (const [role, prefix] of Object.entries(STAFF_CODE_PREFIX)) {
    if (!users[role]) continue;

    const code = `${prefix}-00001`;

    await ensure(
      Employee,
      { instituteId: org._id, userId: users[role]._id },
      {
        employeeCode: code,
        employeeId: code,
        firstName: spec.namePrefix,
        lastName: role,
        displayName: users[role].name,
        workEmail: users[role].email,
        employmentStatus: "active",
      }
    );
  }

  if (users[ROLES.TEACHER]) {
    await ensure(Teacher, { instituteId: org._id, userId: users[ROLES.TEACHER]._id });
  }

  if (users[ROLES.HR]) {
    await ensure(HR, { instituteId: org._id, userId: users[ROLES.HR]._id });
  }

  if (users[ROLES.STUDENT]) {
    await ensure(
      Student,
      { instituteId: org._id, userId: users[ROLES.STUDENT]._id },
      {
        enrollmentNumber: `${spec.codePrefix}-0001`,
        course: "Grade 10",
        // Lets the demo parent see this student's records.
        guardianUserIds: users[ROLES.PARENT] ? [users[ROLES.PARENT]._id] : [],
      }
    );
  }

  if (!seeder.dryRun) {
    const push = {};

    for (const [role, field] of Object.entries(ORGANIZATION_ROLE_ARRAYS)) {
      if (users[role]) push[field] = users[role]._id;
    }

    if (Object.keys(push).length) {
      await Organization.updateOne({ _id: org._id }, { $addToSet: push });
    }
  }
};
