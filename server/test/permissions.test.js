import test from "node:test";
import assert from "node:assert/strict";

import { hasPermission } from "../src/utils/permissions.js";

const ROLES = [
  "admin",
  "principal",
  "hr",
  "accountant",
  "counselor",
  "teacher",
  "support",
  "employee",
  "parent",
  "student",
];

const can = (role, permission) => hasPermission({ role }, permission);

const holders = (permission) => ROLES.filter((role) => can(role, permission));

test("every role has self-service notification preferences and ticket replies", () => {
  for (const role of ROLES) {
    for (const permission of [
      "notification_preference:read",
      "notification_preference:update",
      "ticket:create",
      "ticket_message:create",
    ]) {
      assert.ok(can(role, permission), `${role} should hold ${permission}`);
    }
  }
});

test("every role can chat and manage its own messages (scope enforced in messageController)", () => {
  for (const role of ROLES) {
    for (const permission of [
      "conversation:create",
      "conversation:update",
      "message:create",
      "message:update",
      "message:delete",
    ]) {
      assert.ok(can(role, permission), `${role} should hold ${permission}`);
    }
  }
});

test("super_admin passes every permission check", () => {
  assert.equal(hasPermission({ role: "super_admin" }, "audit:read"), true);
  assert.equal(hasPermission({ role: "super_admin" }, "geofence:create"), true);
});

test("only admin can read the audit log and manage geofences", () => {
  assert.deepEqual(holders("audit:read"), ["admin"]);
  assert.deepEqual(holders("geofence:create"), ["admin"]);
});

test("students and parents cannot write classes, invoices or grades", () => {
  for (const role of ["student", "parent"]) {
    for (const permission of [
      "class:create",
      "class:delete",
      "invoice:create",
      "invoice:update",
      "submission:update",
      "test:create",
    ]) {
      assert.equal(can(role, permission), false, `${role} must not hold ${permission}`);
    }
  }
});

test("principal can run classes and enrollments", () => {
  for (const permission of ["class:create", "class:delete", "enrollment:create", "enrollment:delete"]) {
    assert.ok(can("principal", permission), `principal should hold ${permission}`);
  }
});

test("class attendance codes are limited to admin and teacher", () => {
  assert.deepEqual(holders("qr_session:create"), ["admin", "teacher"]);
});

test("invoice management stays with admin and accountant", () => {
  assert.deepEqual(holders("invoice:create"), ["admin", "accountant"]);
});

test("CRM contacts and customers are not visible to students or parents", () => {
  for (const role of ["student", "parent", "employee"]) {
    assert.equal(can(role, "contact:read"), false);
    assert.equal(can(role, "customer:read"), false);
  }
  assert.ok(can("support", "customer:read"));
});

test("every paid staff role can read payroll (own payslips are scoped in the controller)", () => {
  assert.deepEqual(holders("payroll:read"), [
    "admin",
    "principal",
    "hr",
    "accountant",
    "counselor",
    "teacher",
    "support",
    "employee",
  ]);
  // Running, changing and deleting payroll stays with admin and hr.
  for (const permission of ["payroll:create", "payroll:update", "payroll:delete"]) {
    assert.deepEqual(holders(permission), ["admin", "hr"], permission);
  }
});

test("each role dashboard is limited to its own role", () => {
  assert.deepEqual(holders("stats:superadmin"), []);
  assert.deepEqual(holders("stats:admin"), ["admin", "principal"]);
  assert.deepEqual(holders("stats:hr"), ["admin", "hr"]);
  for (const role of ["teacher", "student", "employee", "accountant", "counselor", "support"]) {
    assert.deepEqual(holders(`stats:${role}`), [role], `stats:${role}`);
  }
});

test("class registers are marked by admin and teacher; codes are redeemed by students", () => {
  assert.deepEqual(holders("attendance:mark"), ["admin", "teacher"]);
  assert.deepEqual(holders("attendance:scan"), ["student"]);
});

test("unknown roles hold nothing", () => {
  assert.equal(hasPermission({ role: "nobody" }, "class:read"), false);
});
