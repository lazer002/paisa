// server/src/utils/resolveRef.js
//
// publicId-first reference resolution.
//
// All client-facing identifiers are publicIds (never raw Mongo _id).
// Clients may still send ObjectId-shaped values when a payload carries a
// populated reference, so every inbound reference goes through resolveRef:
//   - ObjectId-shaped  -> validated, returned as-is
//   - otherwise        -> treated as a publicId and resolved via the
//                         referenced model (throws RESOURCE_NOT_FOUND)
//
// This is intentionally model-agnostic: models already define `publicId`,
// so we only need the right collection to query.

import mongoose from "mongoose";

import ApiError from "./ApiError.js";

const OBJECT_ID_PATTERN =
  /^[0-9a-fA-F]{24}$/;

export const isObjectIdLike = (
  value
) => {
  if (typeof value !== "string") {
    return false;
  }

  if (OBJECT_ID_PATTERN.test(value)) {
    return mongoose.Types.ObjectId.isValid(
      value
    );
  }

  return false;
};

const idOf = (doc) =>
  doc ? String(doc._id) : null;

/**
 * Resolve an inbound reference (publicId or ObjectId) to a concrete _id.
 *
 * @param {Model}  Model        Mongoose model owning the publicId field
 * @param {*}      reference    The inbound value (string | populated doc)
 * @param {Object} [options]
 * @param {string} [options.label]  Human name for error messages
 * @param {Object} [options.scope]  Extra query filters (e.g. tenant scoping)
 * @returns {Promise<string|null>}  The resolved Mongo _id (or null when
 *                                  reference is empty)
 */
export const resolveRef = async (
  Model,
  reference,
  { label = "Resource", scope = {} } = {}
) => {
  if (
    reference === null ||
    reference === undefined ||
    reference === ""
  ) {
    return null;
  }

  // Already a populated document — take its id.
  if (
    typeof reference === "object" &&
    reference._id
  ) {
    return String(reference._id);
  }

  const value = String(reference).trim();

  if (!value) {
    return null;
  }

  if (isObjectIdLike(value)) {
    return value;
  }

  const query = {
    publicId: value,
    ...scope,
  };

  const doc = await Model.findOne(query)
    .select("_id")
    .lean();

  if (!doc) {
    throw ApiError.notFound(
      `${label} not found`,
      "RESOURCE_NOT_FOUND"
    );
  }

  return idOf(doc);
};

/**
 * Resolve many references in one round-trip per distinct value.
 * Returns the resolved _id strings in input order.
 */
export const resolveRefs = async (
  Model,
  references,
  options = {}
) => {
  if (
    !Array.isArray(references) ||
    references.length === 0
  ) {
    return [];
  }

  const resolved = [];

  for (const reference of references) {
    resolved.push(
      await resolveRef(Model, reference, options)
    );
  }

  return resolved;
};

export default resolveRef;
