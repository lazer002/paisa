// server/src/utils/seed.js
//
// Demo data for local testing:
//   - "Demo School" (school): one user per role, extra students and parents,
//     classes, learning, attendance, HR, finance, CRM, support and comms data
//     (see seed/demoData.js), so every role's pages show real records.
//   - "Demo Company Two" (company): one user per business role, used by the
//     tenant-isolation e2e test (scripts/e2e-tenant.mjs).
//
//   npm run seed                  create anything that is missing (idempotent:
//                                 safe to re-run, never duplicates or deletes)
//   npm run seed -- --dry-run     build and validate every record, no database
//   npm run seed -- --reset       delete the demo school's core data first, then recreate it
//
// Refuses to run when NODE_ENV=production. Sign in with
// <role>@demo.paisa.test or <role>@demo2.paisa.test and SEED_PASSWORD
// (default below).

import "dotenv/config";
import "../config/mongoosePlugins.js";

import bcrypt from "bcryptjs";

import { connectDB, disconnectDB } from "../config/db.js";

import { User } from "../models/User.js";
import Organization from "../models/organization.js";
import { Class } from "../models/Class.js";
import Student from "../models/student.js";
import Teacher from "../models/teacher.js";
import Employee from "../models/Employee.js";
import HR from "../models/Hr.js";

import { createSeeder } from "./seed/helpers.js";
import { DEMO_ORG, SECOND_ORG, emailFor, ensureOrganization } from "./seed/orgs.js";
import { seedDemoData } from "./seed/demoData.js";

const DEFAULT_PASSWORD = "Paisa@Demo1";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const RESET = args.has("--reset");

const password = process.env.SEED_PASSWORD || DEFAULT_PASSWORD;

const removeDemoData = async () => {
  const org = await Organization.findOne({ slug: DEMO_ORG.slug }).select("_id");

  if (org) {
    await Promise.all(
      [Class, Student, Teacher, Employee, HR].map((Model) =>
        Model.deleteMany({ instituteId: org._id })
      )
    );
    await Organization.deleteOne({ _id: org._id });
  }

  await User.deleteMany({ email: { $regex: `@${DEMO_ORG.domain.replace(/\./g, "\\.")}$` } });
};

const printSummary = (seeder) => {
  console.log("\n%s per model (created / already there):", DRY_RUN ? "Validated" : "Seed");

  for (const [name, { created, existing }] of [...seeder.stats.entries()].sort()) {
    console.log("  %s %s / %s", name.padEnd(22), String(created).padStart(4), String(existing).padStart(4));
  }

  console.log("\nDemo accounts (password: %s)", password);

  for (const spec of [DEMO_ORG, SECOND_ORG]) {
    console.log("  %s (%s)", spec.name, spec.type);

    for (const role of spec.roles) {
      console.log("    %s  %s", role.padEnd(12), emailFor(spec, role));
    }
  }
};

const seedAll = async () => {
  const seeder = createSeeder({ dryRun: DRY_RUN });
  const passwordHash = await bcrypt.hash(password, 10);

  const demo = await ensureOrganization(seeder, DEMO_ORG, passwordHash);
  await ensureOrganization(seeder, SECOND_ORG, passwordHash);
  await seedDemoData(seeder, { ...demo, passwordHash, spec: DEMO_ORG });

  return seeder;
};

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production");
  }

  if (DRY_RUN) {
    const seeder = await seedAll();
    const total = [...seeder.stats.values()].reduce((sum, s) => sum + s.created, 0);
    console.log("Dry run OK: %d documents validated, nothing written.", total);
    printSummary(seeder);
    return;
  }

  await connectDB();

  try {
    if (RESET) {
      await removeDemoData();
      console.log("Removed existing demo school core data.");
    }

    const seeder = await seedAll();
    printSummary(seeder);
  } finally {
    await disconnectDB();
  }
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
