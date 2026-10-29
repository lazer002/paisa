// server/src/config/userRoleConfig.js

import { ROLES } from "./constants.js";

import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Employee from "../models/Employee.js";
import HR from "../models/Hr.js";

export const CREATABLE_ROLES = Object.freeze({
  [ROLES.SUPER_ADMIN]: [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.PRINCIPAL,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.HR,
    ROLES.ACCOUNTANT,
    ROLES.COUNSELOR,
    ROLES.EMPLOYEE,
    ROLES.SUPPORT,
    ROLES.PARENT,
  ],

  [ROLES.ADMIN]: [
    ROLES.PRINCIPAL,
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.HR,
    ROLES.ACCOUNTANT,
    ROLES.COUNSELOR,
    ROLES.EMPLOYEE,
    ROLES.SUPPORT,
    ROLES.PARENT,
  ],

  // School head: academic accounts only (user:manage in the matrix)
  [ROLES.PRINCIPAL]: [
    ROLES.TEACHER,
    ROLES.STUDENT,
    ROLES.PARENT,
    ROLES.COUNSELOR,
  ],
});

// Profile collection per role. Staff roles share the Employee profile;
// parent has no profile (identity only).
export const ROLE_MODELS = Object.freeze({
  [ROLES.TEACHER]: Teacher,
  [ROLES.STUDENT]: Student,
  [ROLES.EMPLOYEE]: Employee,
  [ROLES.PRINCIPAL]: Employee,
  [ROLES.ACCOUNTANT]: Employee,
  [ROLES.COUNSELOR]: Employee,
  [ROLES.SUPPORT]: Employee,
  [ROLES.HR]: HR,
});

// Employee-code prefix for every Employee-backed role
export const STAFF_CODE_PREFIX = Object.freeze({
  [ROLES.EMPLOYEE]: "EMP",
  [ROLES.PRINCIPAL]: "PRN",
  [ROLES.ACCOUNTANT]: "ACC",
  [ROLES.COUNSELOR]: "CNS",
  [ROLES.SUPPORT]: "SUP",
});

export const ROLE_DATA_KEYS = Object.freeze({
  [ROLES.TEACHER]: "teacher",
  [ROLES.STUDENT]: "student",
  [ROLES.EMPLOYEE]: "employee",
  [ROLES.PRINCIPAL]: "employee",
  [ROLES.ACCOUNTANT]: "employee",
  [ROLES.COUNSELOR]: "employee",
  [ROLES.SUPPORT]: "employee",
  [ROLES.HR]: "hr",
});

export const ORGANIZATION_ROLE_ARRAYS = Object.freeze({
  [ROLES.TEACHER]: "teachers",
  [ROLES.STUDENT]: "students",
  [ROLES.EMPLOYEE]: "employees",
  [ROLES.HR]: "hrManagers",
});