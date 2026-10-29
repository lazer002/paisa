// server/src/config/mongoosePlugins.js
//
// Global Mongoose plugins. Import this BEFORE any model is loaded
// (server.js and the seed script do) because plugins only apply to schemas
// that are compiled afterwards.

import mongoose from "mongoose";

const PRESENT_TYPES = ["string", "objectId", "number"];

/**
 * Many models declare tenant-scoped unique codes as
 *   { instituteId: 1, <something>Code: 1 }, { unique: true, sparse: true }
 * A sparse COMPOUND index still indexes a document as soon as one of its
 * fields exists, and instituteId always does, so every record that has no
 * code collides on null. The second class, test, invoice, contact... in a
 * tenant then fails with E11000.
 *
 * Rewrite those indexes as partial indexes that only cover documents where
 * the optional fields actually hold a value.
 */
export const partialUniqueIndexes = (schema) => {
  for (const entry of schema._indexes ?? []) {
    const [fields, options] = entry;

    if (!options?.unique || !options.sparse || options.partialFilterExpression) {
      continue;
    }

    const optionalKeys = Object.keys(fields).filter((key) => key !== "instituteId");

    if (Object.keys(fields).length < 2 || optionalKeys.length === 0) {
      continue;
    }

    delete options.sparse;
    options.partialFilterExpression = Object.fromEntries(
      optionalKeys.map((key) => [key, { $type: PRESENT_TYPES }])
    );
  }
};

mongoose.plugin(partialUniqueIndexes);
