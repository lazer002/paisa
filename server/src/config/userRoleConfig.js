// server/src/config/userRoleConfig.js

import { ROLES } from "./constants.js";

import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
import Employee from "../models/employee.js";
import HR from "../models/hr.js";

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
});

export const ROLE_MODELS = Object.freeze({
  [ROLES.TEACHER]: Teacher,
  [ROLES.STUDENT]: Student,
  [ROLES.EMPLOYEE]: Employee,
  [ROLES.HR]: HR,
});

export const ROLE_DATA_KEYS = Object.freeze({
  [ROLES.TEACHER]: "teacher",
  [ROLES.STUDENT]: "student",
  [ROLES.EMPLOYEE]: "employee",
  [ROLES.HR]: "hr",
});

export const ORGANIZATION_ROLE_ARRAYS = Object.freeze({
  [ROLES.TEACHER]: "teachers",
  [ROLES.STUDENT]: "students",
  [ROLES.EMPLOYEE]: "employees",
  [ROLES.HR]: "hrManagers",
});