// server/src/utils/peopleHelpers.js

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import crypto from "node:crypto";
import { User, Roles } from "../models/User.js";
import Organization from "../models/organization.js";

const PASSWORD_SALT_ROUNDS = Math.min(
  14,
  Math.max(
    10,
    Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10) || 12
  )
);

const isValidObjectId = (value) =>
  Boolean(value) && mongoose.isValidObjectId(value);

const hashPassword = async (plainPassword) => {
  if (
    plainPassword === undefined ||
    plainPassword === null ||
    String(plainPassword).length < 1
  ) {
    throw new Error("Password is required");
  }

  return bcrypt.hash(
    String(plainPassword),
    PASSWORD_SALT_ROUNDS
  );
};

const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(
    String(plainPassword),
    String(hashedPassword)
  );
};

const resolveInstitute = async (actor, requestedInstituteId = null) => {
  if (!actor) {
    throw new Error("Authenticated user is required");
  }

  if (actor.role === Roles.SUPER_ADMIN) {
    if (!requestedInstituteId) {
      return null;
    }

    if (!isValidObjectId(requestedInstituteId)) {
      return null;
    }

    const organization = await Organization.findById(
      requestedInstituteId
    )
      .select("_id")
      .lean();

    return organization ? organization._id : null;
  }

  if (!actor.instituteId) {
    return null;
  }

  return actor.instituteId;
};

const scopedQuery = (actor, additionalQuery = {}) => {
  if (!actor) {
    throw new Error("Authenticated user is required");
  }

  if (!additionalQuery || typeof additionalQuery !== "object") {
    additionalQuery = {};
  }

  if (actor.role === Roles.SUPER_ADMIN) {
    return { ...additionalQuery };
  }

  if (!actor.instituteId) {
    return {
      ...additionalQuery,
      instituteId: null,
      _id: { $in: [] },
    };
  }

  return {
    ...additionalQuery,
    instituteId: actor.instituteId,
  };
};

const scopedUserQuery = (actor, additionalQuery = {}) =>
  scopedQuery(actor, additionalQuery);

const assertSameInstitute = (actor, instituteId) => {
  if (!actor) {
    throw new Error("Authenticated user is required");
  }

  if (actor.role === Roles.SUPER_ADMIN) {
    return true;
  }

  if (!actor.instituteId || !instituteId) {
    return false;
  }

  return String(actor.instituteId) === String(instituteId);
};

const findScopedUser = async (
  actor,
  userId,
  projection = null
) => {
  if (!isValidObjectId(userId)) {
    return null;
  }

  const query = scopedUserQuery(actor, {
    _id: userId,
  });

  let request = User.findOne(query);

  if (projection) {
    request = request.select(projection);
  }

  return request.lean();
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const sanitized = { ...user };

  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.refreshTokens;
  delete sanitized.passwordResetToken;
  delete sanitized.passwordResetExpires;
  delete sanitized.emailVerificationToken;
  delete sanitized.emailVerificationExpires;
  delete sanitized.loginAttempts;
  delete sanitized.lockUntil;

  return sanitized;
};

export {
  hashPassword,
  comparePassword,
  resolveInstitute,
  scopedQuery,
  scopedUserQuery,
  findScopedUser,
  assertSameInstitute,
  sanitizeUser,
  isValidObjectId,
  Roles,
};
