// src/controllers/employeeController.js

import { User, Roles } from "../models/User.js";

import {
  hashPassword,
  resolveInstitute,
  scopedQuery,
} from "../utils/peopleHelpers.js";

import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
} from "../utils/response.js";

import { resolveRef } from "../utils/resolveRef.js";

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      instituteId,
      profile,
    } = req.body;

    if (!name || !email || !password) {
      return sendError(
        res,
        400,
        "Name, email and password are required"
      );
    }

    const normalizedEmail =
      String(email)
        .toLowerCase()
        .trim();

    const existing =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existing) {
      return sendError(
        res,
        400,
        "User already exists"
      );
    }

    const resolvedInstitute =
      await resolveInstitute(
        req.user,
        instituteId
      );

    if (
      requestedButUnresolved(
        resolvedInstitute,
        instituteId
      )
    ) {
      return sendError(
        res,
        400,
        "Invalid instituteId"
      );
    }

    const employee =
      await User.create({
        name,
        email: normalizedEmail,

        passwordHash:
          await hashPassword(password),

        role: Roles.EMPLOYEE,

        instituteId:
          resolvedInstitute,

        profile:
          profile || {},
      });

    const safe =
      employee.toObject();

    delete safe.passwordHash;

    sendCreated(
      res,
      "Employee created successfully",
      safe
    );
  } catch (err) {
    console.error(
      "Create Employee error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};

// Get all Employees
export const getEmployees = async (
  req,
  res
) => {
  try {
    if (
      !req.user.instituteId &&
      req.user.role !== Roles.SUPER_ADMIN
    ) {
      return sendSuccess(
        res,
        "Employees fetched",
        []
      );
    }

    const employees =
      await User.find({
        role: Roles.EMPLOYEE,
        ...scopedQuery(req.user),
      })
        .select(
          "-passwordHash -failedAttempts -lockedUntil"
        )
        .populate(
          "instituteId",
          "name type"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    sendSuccess(
      res,
      "Employees fetched",
      employees
    );
  } catch (err) {
    console.error(
      "Get Employees error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};function requestedButUnresolved(
  resolved,
  requested
) {
  return Boolean(requested && !resolved);
}

/* =========================================================
   GET ONE EMPLOYEE
========================================================= */

export const getEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    })
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type")
      .lean();

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    sendSuccess(res, "Employee fetched", employee);
  } catch (err) {
    console.error("Get employee error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   UPDATE EMPLOYEE
========================================================= */

export const updateEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    const updates = {};

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }

    if (["active", "inactive"].includes(req.body.status)) {
      updates.status = req.body.status;
    }

    if (!Object.keys(updates).length) {
      return sendError(res, 400, "No editable fields supplied");
    }

    Object.assign(employee, updates);
    await employee.save();

    const safe = employee.toObject();
    delete safe.passwordHash;

    sendSuccess(res, "Employee updated", safe);
  } catch (err) {
    console.error("Update employee error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   DELETE EMPLOYEE
========================================================= */

export const deleteEmployee = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "Employee",
    });

    const employee = await User.findOne({
      _id,
      role: Roles.EMPLOYEE,
      ...scopedQuery(req.user),
    });

    if (!employee) {
      return sendNotFound(res, "Employee not found");
    }

    await employee.deleteOne();

    sendSuccess(res, "Employee deleted", null);
  } catch (err) {
    console.error("Delete employee error:", err);
    sendError(res, 500, "Server error");
  }
};