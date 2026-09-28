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
} from "../utils/response.js";

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
};

function requestedButUnresolved(
  resolved,
  requested
) {
  return Boolean(
    requested && !resolved
  );
}