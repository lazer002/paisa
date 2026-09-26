// server/src/utils/sequence.js

import Counter from "../models/counter.js";

const getNextSequence = async (key) => {
  if (!key || typeof key !== "string") {
    throw new TypeError("Sequence key must be a non-empty string");
  }

  const normalizedKey = key.trim();

  if (!normalizedKey) {
    throw new TypeError("Sequence key must be a non-empty string");
  }

  const counter = await Counter.findOneAndUpdate(
    { key: normalizedKey },
    {
      $inc: {
        seq: 1,
      },
      $setOnInsert: {
        key: normalizedKey,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).lean();

  if (!counter) {
    throw new Error(`Failed to generate sequence for "${normalizedKey}"`);
  }

  return counter.seq;
};

const getCurrentSequence = async (key) => {
  if (!key || typeof key !== "string") {
    throw new TypeError("Sequence key must be a non-empty string");
  }

  const normalizedKey = key.trim();

  const counter = await Counter.findOne({
    key: normalizedKey,
  })
    .select({ seq: 1 })
    .lean();

  return counter?.seq ?? 0;
};

const resetSequence = async (key, value = 0) => {
  if (!key || typeof key !== "string") {
    throw new TypeError("Sequence key must be a non-empty string");
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError("Sequence value must be a non-negative integer");
  }

  const normalizedKey = key.trim();

  const counter = await Counter.findOneAndUpdate(
    { key: normalizedKey },
    {
      $set: {
        seq: value,
      },
      $setOnInsert: {
        key: normalizedKey,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).lean();

  return counter.seq;
};

export {
  getNextSequence,
  getCurrentSequence,
  resetSequence,
};

export default getNextSequence;