// src/controllers/hrController.js

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

// Create HR
export const createHR = async (req, res) => {
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

    const hr =
      await User.create({
        name,
        email: normalizedEmail,

        passwordHash:
          await hashPassword(password),

        role: Roles.HR,

        instituteId:
          resolvedInstitute,

        profile:
          profile || {},
      });

    const safe =
      hr.toObject();

    delete safe.passwordHash;

    sendCreated(
      res,
      "HR created successfully",
      safe
    );
  } catch (err) {
    console.error(
      "Create HR error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};

// Get all HRs
export const getHRs = async (
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
        "HRs fetched",
        []
      );
    }

    const hrs =
      await User.find({
        role: Roles.HR,
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
      "HRs fetched",
      hrs
    );
  } catch (err) {
    console.error(
      "Get HRs error:",
      err
    );

    sendError(
      res,
      500,
      "Server error"
    );
  }
};/* =========================================================
   GET ONE HR
========================================================= */

export const getHR = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "HR",
    });

    const hr = await User.findOne({
      _id,
      role: Roles.HR,
      ...scopedQuery(req.user),
    })
      .select("-passwordHash -failedAttempts -lockedUntil")
      .populate("instituteId", "name type")
      .lean();

    if (!hr) {
      return sendNotFound(res, "HR not found");
    }

    sendSuccess(res, "HR fetched", hr);
  } catch (err) {
    console.error("Get HR error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   UPDATE HR
========================================================= */

export const updateHR = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "HR",
    });

    const hr = await User.findOne({
      _id,
      role: Roles.HR,
      ...scopedQuery(req.user),
    });

    if (!hr) {
      return sendNotFound(res, "HR not found");
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

    Object.assign(hr, updates);
    await hr.save();

    const safe = hr.toObject();
    delete safe.passwordHash;

    sendSuccess(res, "HR updated", safe);
  } catch (err) {
    console.error("Update HR error:", err);
    sendError(res, 500, "Server error");
  }
};

/* =========================================================
   DELETE HR
========================================================= */

export const deleteHR = async (req, res) => {
  try {
    const _id = await resolveRef(User, req.params.publicId, {
      label: "HR",
    });

    const hr = await User.findOne({
      _id,
      role: Roles.HR,
      ...scopedQuery(req.user),
    });

    if (!hr) {
      return sendNotFound(res, "HR not found");
    }

    await hr.deleteOne();

    sendSuccess(res, "HR deleted", null);
  } catch (err) {
    console.error("Delete HR error:", err);
    sendError(res, 500, "Server error");
  }
};

function requestedButUnresolved(
  resolved,
  requested
) {
  return Boolean(requested && !resolved);
}